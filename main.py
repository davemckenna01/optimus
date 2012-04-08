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

class MainHandler(webapp.RequestHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        self.response.out.write('<html><body>')
        self.response.out.write('<form action="%s" method="POST" enctype="multipart/form-data">' % upload_url)
        self.response.out.write("""Upload File: <input type="file" name="file"><br> <input type="submit"
            name="submit" value="Submit"> </form></body></html>""")

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
  def post(self):
    upload_files = self.get_uploads('file')  # 'file' is file upload field in the form
    blob_info = upload_files[0]
    
    afile = Files(blobRef = blob_info.key(), name = blob_info.filename)
    afile.put()

    self.redirect('/files')
  


class ServeHandler(blobstore_handlers.BlobstoreDownloadHandler):
  def get(self, resource):
    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)
    self.send_blob(blob_info)


class FileHandler(webapp.RequestHandler):
  def get(self):
    all_files = blobstore.BlobInfo.all()

    #blob_reader = blobstore.BlobReader(blob_key)

    res = ''
    for f in all_files:
      res += '<a href="/serve/%s">%s</a><br/>' % (f.key(), f.filename)

    self.response.out.write(res)



app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/upload', UploadHandler),
                               ('/serve/([^/]+)?', ServeHandler),
                               ('/files', FileHandler),
                              ], debug=True)


