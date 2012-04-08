import os
import urllib
import logging

from google.appengine.ext import db
from google.appengine.ext import blobstore
from google.appengine.ext import webapp
from google.appengine.ext.webapp import blobstore_handlers

import webapp2

"""
Manage Files
- list files: /files     GET
- add files: /files    PUT (or POST?)

Manage Individual File
- view file: /files/{id}    GET

Run algorithm on file
- run: /files/{id}/run/{algo}     POST
"""

class Files(db.Model):
  blobKey = blobstore.BlobReferenceProperty()



class MainHandler(webapp.RequestHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        self.response.out.write('<html><body>')
        self.response.out.write('<form action="%s" method="POST" enctype="multipart/form-data">' % upload_url)
        self.response.out.write("""Upload File: <input type="file" name="file"><br> <input type="submit"
            name="submit" value="Submit"> </form></body></html>""")

class FileHandler(blobstore_handlers.BlobstoreUploadHandler):
  def post(self):
    upload_files = self.get_uploads('file')  # 'file' is file upload field in the form
    blob_info = upload_files[0]
    logging.info(blob_info.key())
    
    afile = Files(blobKey = blob_info.key())
    afile.put()


    self.redirect('/serve/%s' % blob_info.key())
  
  def get(self):
    blobstore.GetKeys()
    #blob_reader = blobstore.BlobReader(blob_key)
    #list all files
    pass


class ServeHandler(blobstore_handlers.BlobstoreDownloadHandler):
  def get(self, resource):
    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)
    self.send_blob(blob_info)


app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/upload', FileHandler),
                               ('/serve/([^/]+)?', ServeHandler),
                              ], debug=True)


