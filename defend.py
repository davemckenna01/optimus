import random
import optimization
import pprint

consumers_labels = ['name', 'arrow weight', 'close combat weight']
consumers = [
  ['eastwatch', 0.2, 0.8],
  ['castleblack', 0.4, 0.6],
  ['shadowtower', 0.2, 0.8]
]

#append an empty list to be filled by resources
for consumer in consumers:
  consumer.append([]);

resources_labels = ['name', 'arrow', 'close combat']
resources = [
  ['jonsnow',         8,    8],
  ['samtarly',        1,		5],
  ['dolorousedd',     5,		4],
  ['eddisontollett',  5,		3],
  ['cotterpyke',      6,		6],
  ['clydas',          2,		4],
  ['bowenmarsh',      4,		1],
  ['hobb',            3,		7],
  ['donalnoye',       6,		0],
  ['owen',            3,		3],
  ['yarwick',         2,		5],
  ['cellador',        4,		3],
  ['jackbulwer',      3,		2],
  ['emmett',          5,		7],
  ['denys',           5,		4],
  ['wallace',         6,		2],
  ['mullin',          3,		1],
  ['halfhand',        9,		9],
  ['stonesnake',      7,		8],
  ['harmune',         2,		5],
  ['tattersalt',      2,		5],
  ['glendon',         4,		6],
  ['hewett',          6,		1],
  ['maynard',         2,		1],
  ['barleycorn',      2,		5],
  ['robb',            9,		9],
  ['bran',            2,		7],
  ['rickon',          2,		2],
  ['barristan',      10,	 10],
  ['lordmormont',     7,		8],
  ['arya',            4,		6],
  ['brienne',         9,		9],
  ['tyrion',          4,		8],
  ['ned',            10,   10]
]

#What a solution looks like:
# [0,1,2,0,2,0,1,0,0,2,1,2,0,0,1,0,2,1,1,0,2,1,0...]
#where each list slot represents a particular brother
#from the brothers list, and the value of a slot 
#represents the castle that brother is assigned to

#So, there are len(castles)**len(brothers) possibilities,
#which at the time of writing = 3**34 = A SHITLOAD (like trillions)

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
print total_attr_strengths

#Ideal attribute strength at each consumer.
#This is simple right now becuase we're just dividing total
#strengths by # of consumers.
optimal_attr_strengths = []
for a in range(0, len(total_attr_strengths)):
  optimal_attr_strengths.append(total_attr_strengths[a]/len(consumers))
print optimal_attr_strengths

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
    consumer_resources = [resources[i] for i in consumers[c][len(consumers[0])-1]]

    #Add up all the strength of the resources in the consumer
    solution_attr_strengths = []
    for a in range(0, len(resources[0]) - 1):
      solution_attr_strengths.append(sum([cr[a+1] for cr in consumer_resources]))

    #Normalize the number to be always non-negative: abs(). B/C whether 
    #the solution over or under supplies the consumer is irrelevant
    for a in range(0, len(resources[0]) - 1):
      cost += abs(optimal_attr_strengths[a] - solution_attr_strengths[a])

  return cost

#Print out a solution (w/ names of brothers and castles, etc)
def print_solution(vec):

  #Make sure consumers are empty
  for c in range(len(consumers)):
    consumers[c][len(consumers[0])-1] = []

  #Add resources to the consumer
  for r in range(len(vec)):
    consumers[vec[r]][len(consumers[0])-1].append(r)

  #Pretty print the solution
  for consumer in consumers:
    print "=== Consumer: %s ===" % consumer[0]
    for res in consumer[len(consumers[0])-1]:
      print "%15s A: %2s  S: %2s" % (resources[res][0], resources[res][1], resources[res][2])
    for a in range(0, len(resources[0]) - 1):
      total = sum([resources[i][a+1] for i in consumer[len(consumers[0])-1]])
      print "%s strength at consumer: %s" % (resources_labels[a+1], total)

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
