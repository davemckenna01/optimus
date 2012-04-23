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
from google.appengine.ext import db
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext.webapp import template

#Models

class FileMeta(db.Model):
  blob_info = blobstore.BlobReferenceProperty()
  name = db.StringProperty(required=True)
  description = db.StringProperty()
  creation = db.DateTimeProperty()

class Solution(db.Model):
  blob_info = blobstore.BlobReferenceProperty()
  consumers = db.ListProperty(str,required=True)
  algorithm = db.StringProperty(required=True, choices=set(['random','hillclimb','genetic','annealing']))
  vector = db.ListProperty(int,required=True)
  cost = db.IntegerProperty(required=True)


#URL Handlers

class MainHandler(webapp.RequestHandler):
  def get(self):
    path = os.path.join(os.path.dirname(__file__), 'templates/index.html')
    self.response.out.write(template.render(path, {'upload_url': '/resources'}))


class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
  def post(self):
    upload_files = self.get_uploads('file')
    blob_info = upload_files[0]

    fname = blob_info.filename
    custom = self.request.get('customFilename')
    if (custom):
      fname = custom

    description = self.request.get('description')

    file_meta = FileMeta(
        blob_info = blob_info.key(),
        name = fname,
        description = description,
        creation = blob_info.creation
    )
    file_meta.put()

    self.redirect('/')

    #self.response.out.write(json.dumps({
    #  'blobKey': str(file_meta.blob_info.key()),
    #  'name': file_meta.name,
    #  'description': file_meta.description
    #}))


class ResourceDetailHandler(blobstore_handlers.BlobstoreDownloadHandler):
  def put(self, resource):
    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)

    file_meta = FileMeta.all().filter('blob_info = ', blob_info.key()).get()

    payload = json.loads(self.request.body)

    name = payload['name']
    description = payload['description']

    if name != file_meta.name or description != file_meta.description:
      file_meta.name = name
      file_meta.description = description
      file_meta.put()
      self.response.set_status('200')
    else:
      #Another code?
      self.response.set_status('200')

  #also need to delete any solutions associated with the file,
  #or else they will be orphaned in the google datastore!!!
  def delete(self, resource):
    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)

    file_meta = FileMeta.all().filter('blob_info = ', blob_info.key()).get()

    #This needs to be more robust
    file_meta.delete()
    blob_info.delete()
    self.response.set_status('200')

  def get(self, resource):
    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)

    file_meta = FileMeta.all().filter('blob_info = ', blob_info.key()).get()

    self.response.out.write(json.dumps({
      'blobKey': str(file_meta.blob_info.key()),
      'name': file_meta.name,
      'description': file_meta.description,
      'content': blob_info.open().readlines()
    }))
    #self.send_blob(blob_info)


class ResourceHandler(blobstore_handlers.BlobstoreUploadHandler):
  def post(self):
    upload_url = blobstore.create_upload_url('/_upload')
    #app engine uses a unique one-time url for blob uploads
    #so we need to redirect there
    self.response.set_status('307')
    self.response.headers.add_header('Location', upload_url)

  def get(self):
    all_files = FileMeta.all().order('-creation')
    j = []
    for f in all_files:
      blob_key = str(f.blob_info.key())
      j.append({'name':f.name, 'blobKey': blob_key, 'description': f.description})
    self.response.out.write(json.dumps(j))


class SolutionDetailHandler(webapp.RequestHandler):
  def get(self, blob_key, sol_key):
    sol = Solution.get(sol_key)
    j = {'cost':sol.cost,
         'vector':sol.vector,
         'consumers':sol.consumers,
         'algorithm':sol.algorithm,
         'blobKey':str(sol.blob_info.key()),
         'solKey':str(sol.key())
    }

    self.response.out.write(json.dumps(j))

  def delete(self, blob_key, sol_key):
    sol_key = str(urllib.unquote(sol_key))
    Solution.get(sol_key).delete()
    self.response.set_status('200')


class SolutionHandler(webapp.RequestHandler):
  def post(self, resource):

    payload = json.loads(self.request.body)

    consumers = payload['consumers']
    algorithm = payload['algorithm']

    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)
    blob_reader = blobstore.BlobReader(resource)

    resourceReader = csv.reader(blob_reader.readlines(), delimiter=',', quotechar='|')

    resources_labels = resourceReader.next()
    resources = [[row[0]]+[int(i) for i in row[1:]] for row in resourceReader]

    prov = provision.Provision(resources, resources_labels, consumers, algorithm)

    cost, sol_vec = prov.optimize()

    sol = Solution(
      blob_info = blob_info.key(),
      consumers = consumers.split(','),
      algorithm = algorithm,
      vector = sol_vec,
      cost = cost
    )
    sol.put()

    j = {'cost':sol.cost,
         'vector':sol.vector,
         'consumers':sol.consumers,
         'algorithm':sol.algorithm,
         'blobKey':str(sol.blob_info.key()),
         'solKey':str(sol.key())
    }
    self.response.out.write(json.dumps(j))

  def get(self, blob_key):

    blob_info = blobstore.BlobInfo.get(blob_key)

    sols = Solution.all().filter('blob_info = ', blob_info.key())
    j = []
    for sol in sols:
      j.append({'cost':sol.cost,
           'vector':sol.vector,
           'consumers':sol.consumers,
           'algorithm':sol.algorithm,
           'blobKey':str(sol.blob_info.key()),
           'solKey':str(sol.key())
      })

    self.response.out.write(json.dumps(j))


app = webapp.WSGIApplication([('/', MainHandler),
                               ('/resources/(.+?)/solutions/(.+?)', SolutionDetailHandler),
                               ('/resources/(.+?)/solutions', SolutionHandler),
                               ('/resources/(.+?)', ResourceDetailHandler),
                               ('/resources', ResourceHandler),
                               ('/_upload', UploadHandler),
                              ], debug=True)


