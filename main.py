import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
import urllib
import logging
import json
import provision
import csv

from google.appengine.ext import blobstore
from google.appengine.ext import webapp
from google.appengine.ext.webapp import blobstore_handlers


class MainHandler(webapp.RequestHandler):
  def get(self):
    upload_url = blobstore.create_upload_url('/files')
    self.response.out.write('<html><body>')
    self.response.out.write('<form action="%s" method="POST" enctype="multipart/form-data">' % upload_url)
    self.response.out.write("""Upload File: <input type="file" name="file"><br> <input type="submit"
                            name="submit" value="Submit"> </form></body></html>""")


class GetUploadURLHandler(webapp.RequestHandler):
  def get(self):
    upload_url = blobstore.create_upload_url('/files')

    self.response.out.write(json.dumps({'data':[{'uploadUrl': upload_url}]}))


class FileDetailHandler(blobstore_handlers.BlobstoreDownloadHandler):
  def get(self, resource):
    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)

    self.send_blob(blob_info)


class FileHandler(blobstore_handlers.BlobstoreUploadHandler):
  def post(self):
    upload_files = self.get_uploads('file')  # 'file' is file upload field in the form
    blob_info = upload_files[0]

    self.response.out.write(json.dumps({'data':[{'file': str(blob_info.key())}]}))


  def get(self):
    all_files = blobstore.BlobInfo.all()

    j = {'data':[]}
    for f in all_files:
      url = '/files/%s' % f.key()
      j['data'].append({'name':f.filename, 'url': url})

    self.response.out.write(json.dumps(j))


class FileOptimizeHandler(webapp.RequestHandler):
  def get(self, blob_key, algorithm, consumers):

    blob_reader = blobstore.BlobReader(blob_key)

    resourceReader = csv.reader(blob_reader.readlines(), delimiter=',', quotechar='|')

    resources_labels = resourceReader.next()
    resources = [[row[0]]+[int(i) for i in row[1:]] for row in resourceReader]

    prov = provision.Provision(resources, resources_labels, consumers, algorithm)

    cost, sol_vec = prov.optimize()

    self.response.out.write(json.dumps({'cost':cost,'solution':sol_vec}))


app = webapp.WSGIApplication([('/', MainHandler),
                               ('/getUploadUrl', GetUploadURLHandler),
                               ('/files/([^/]+)?/run/([^/]+)?/([^/]+)?', FileOptimizeHandler),
                               ('/files/([^/]+)?', FileDetailHandler),
                               ('/files', FileHandler),
                              ], debug=True)


