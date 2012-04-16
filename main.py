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
from google.appengine.ext.webapp import template


class MainHandler(webapp.RequestHandler):
  def get(self):
    upload_url = blobstore.create_upload_url('/files')
    path = os.path.join(os.path.dirname(__file__), 'templates/main.html')
    self.response.out.write(template.render(path, {'upload_url': upload_url}))

class UploadURLHandler(webapp.RequestHandler):
  def get(self):
    upload_url = blobstore.create_upload_url('/files')
    self.response.out.write(json.dumps({'uploadUrl': upload_url}))


class FileDetailHandler(blobstore_handlers.BlobstoreDownloadHandler):
  def get(self, resource):
    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)

    self.send_blob(blob_info)


class FileHandler(blobstore_handlers.BlobstoreUploadHandler):
  def post(self, mime):
    upload_files = self.get_uploads('file')  # 'file' is file upload field in the form
    blob_info = upload_files[0]

    if mime == '.json':
      self.response.out.write(json.dumps({'data':[{'file': str(blob_info.key())}]}))
    else:
      self.redirect('/files')

  def get(self):
    all_files = blobstore.BlobInfo.all()

    j = []
    for f in all_files:
      blob_key = str(f.key())
      j.append({'name':f.filename, 'blobKey': blob_key})

    self.response.out.write(json.dumps(j))


class FileOptimizeHandler(webapp.RequestHandler):
  def get(self, blob_key, consumers, algorithm):

    blob_reader = blobstore.BlobReader(blob_key)

    resourceReader = csv.reader(blob_reader.readlines(), delimiter=',', quotechar='|')

    resources_labels = resourceReader.next()
    resources = [[row[0]]+[int(i) for i in row[1:]] for row in resourceReader]

    prov = provision.Provision(resources, resources_labels, consumers, algorithm)

    cost, sol_vec = prov.optimize()

    j = {'cost':cost,'solution':sol_vec}

    self.response.out.write(json.dumps(j))



app = webapp.WSGIApplication([('/main', MainHandler),
                               ('/uploadUrl', UploadURLHandler),
                               #I'm not crazy about this regex: (.+?)(\.[^.]*$|$)
                               #that I'm using to pick out "file extensions" i.e. <resource>.json
                               #or w/e. B/c this forces me to raise 404s on invalid "file extensions"
                               #in the handler rather than by url matching... it's ok for now though
                               ('/files/(.+?)/run/(.+?)/(.+?)', FileOptimizeHandler),
                               ('/files/(.+?)', FileDetailHandler),
                               ('/files', FileHandler),
                              ], debug=True)


