import random
import optimization
import pprint

consumers = [
  ['eastwatch'],
  ['castleblack'],
  ['shadowtower']
]
#append an empty list to be filled by resources
for consumer in consumers:
  consumer.append([]);

resources_labels = ['name', 'arrow', 'close combat', 'magic']
resources = [
  ['jonsnow',         8,    8, 5],
  ['samtarly',        1,		5,5],
  ['dolorousedd',     5,		4,4],
  ['eddisontollett',  5,		3,2],
  ['cotterpyke',      6,		6,1],
  ['clydas',          2,		4,5],
  ['bowenmarsh',      4,		1,2],
  ['hobb',            3,		7,3],
  ['donalnoye',       6,		0,5],
  ['owen',            3,		3,9],
  ['yarwick',         2,		5,2],
  ['cellador',        4,		3,1],
  ['jackbulwer',      3,		2,8],
  ['emmett',          5,		7,6],
  ['denys',           5,		4,5],
  ['wallace',         6,		2,9],
  ['mullin',          3,		1,4],
  ['halfhand',        9,		9,4],
  ['stonesnake',      7,		8,4],
  ['harmune',         2,		5,6],
  ['tattersalt',      2,		5,4],
  ['glendon',         4,		6,3],
  ['hewett',          6,		1,1],
  ['maynard',         2,		1,3],
  ['barleycorn',      2,		5,3],
  ['robb',            9,		9,7],
  ['bran',            2,		7,2],
  ['rickon',          2,		2,8],
  ['barristan',      10,	 10,2],
  ['lordmormont',     7,		8,1],
  ['arya',            4,		6,4],
  ['brienne',         9,		9,5],
  ['tyrion',          4,		8,6],
  ['ned',            10,   10,4]
]

#What a solution looks like:
# [0,1,2,0,2,0,1,0,0,2,1,2,0,0,1,0,2,1,1,0,2,1,0...]
#where each list slot represents a particular resource
#from the resources list, and the value of a slot 
#represents the consumer that resource is assigned to

#What the domain looks like
# [(0,2),(0,2),(0,2),(0,2),(0,2),(0,2),(0,2)...]

domain = [(0,len(consumers)-1)] * len(resources)

#This is just used for informal testing of the cost fn
randomvec = [random.randint(domain[i][0],domain[i][1])
             for i in range(len(domain))]

#Add up the total strength for each attribute possessed by a resource
total_attr_strengths = []
for a in range(0, len(resources[0]) - 1):
  total_attr_strengths.append(sum([r[a+1] for r in resources]))
print 'total combined attr strength:', total_attr_strengths

#Ideal attribute strength at each consumer.
#This is simple right now becuase we're just dividing total
#strengths by # of consumers.
optimal_attr_strengths = []
for a in range(0, len(total_attr_strengths)):
  optimal_attr_strengths.append(total_attr_strengths[a]/len(consumers))
print 'optimal strength at each consumer:', optimal_attr_strengths

def provisioning_cost(vec):
  cost = 0

  #Make sure consumers are empty
  for c in range(len(consumers)):
    consumers[c][len(consumers[0])-1] = []

  #Add resources to the consumers based on the solution vector passed in
  for r in range(len(vec)):
    consumers[vec[r]][len(consumers[0])-1].append(r)

  #Loop through the consumers and determine how strength was 
  #distributed and calculate cost
  for c in range(len(consumers)):
    consumer_resources = [resources[res] for res in consumers[c][len(consumers[0])-1]]

    #Add up all the strength of the resources in the consumer
    solution_attr_strengths = []
    for a in range(0, len(resources[0]) - 1):
      solution_attr_strengths.append(sum([cr[a+1] for cr in consumer_resources]))

    #Normalize the number to be always non-negative: abs(). B/C whether 
    #the solution over or under supplies the consumer is irrelevant
    for a in range(0, len(solution_attr_strengths)):
      cost += abs(optimal_attr_strengths[a] - solution_attr_strengths[a])

  return cost

#Print out a solution (w/ names of resources and consumers, etc)
def print_solution(vec):

  #Make sure consumers are empty
  for c in range(len(consumers)):
    consumers[c][len(consumers[0])-1] = []

  #Add resources to the consumer
  for r in range(len(vec)):
    consumers[vec[r]][len(consumers[0])-1].append(r)

  #Pretty print the solution
  for consumer in consumers:
    print "=== Consumer: %s ===" % consumer[0] #the consumer "name"
    for res in consumer[len(consumers[0])-1]:

      for d in range(0, len(resources[0])):
        print "%20s: %s" % (resources_labels[d], resources[res][d])

    for a in range(0, len(resources[0]) - 1):
      total = sum([resources[r][a+1] for r in consumer[len(consumers[0])-1]])
      print "%s strength at %s: %s" % (resources_labels[a+1], consumer[0], total)

#optimization.geneticoptimize(domain, defendcost)
#optimization.annealingoptimize(domain, defendcost)
#optimization.hillclimb(domain, defendcost)
#optimization.randomoptimize(domain, defendcost)

def main():
  #pass
  s = optimization.geneticoptimize(domain, provisioning_cost)
  #pprint.pprint(consumers)
  print_solution(s)

if __name__ == "__main__":
    #import profile
    #profile.run("main()")
    main()
