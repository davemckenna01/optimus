import pprint
import csv

resourceReader = csv.reader(open('brothers.csv', 'rb'), delimiter=',', quotechar='|')
resources_labels = resourceReader.next()
resources = [[row[0]]+[int(i) for i in row[1:]] for row in resourceReader]

pprint.pprint(resources_labels)
pprint.pprint(resources)
