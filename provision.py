import random
import optimization
import csv
import pprint
import sys

resourceFile = sys.argv[1] #'brothers.csv'
consumerStrings = sys.argv[2] #'eastwatch,castleblack,shadowtower'

resourceReader = csv.reader(open(resourceFile, 'rb'), delimiter=',', quotechar='|')
resources_labels = resourceReader.next()
resources = [[row[0]]+[int(i) for i in row[1:]] for row in resourceReader]

consumers = [[con] for con in consumerStrings.split(',')]
#append an empty list to be filled by resources
for consumer in consumers:
  consumer.append([]);


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
#print 'total combined attr strength:', total_attr_strengths

#Ideal attribute strength at each consumer.
#This is simple right now becuase we're just dividing total
#strengths by # of consumers.
optimal_attr_strengths = []
for a in range(0, len(total_attr_strengths)):
  optimal_attr_strengths.append(total_attr_strengths[a]/len(consumers))
#print 'optimal strength at each consumer:', optimal_attr_strengths

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


def main():

  if len(sys.argv) == 4:
    if sys.argv[3] == 'annealing':
      cost, sol = optimization.annealingoptimize(domain, provisioning_cost)
    elif sys.argv[3] == 'hillclimb':
      cost, sol = optimization.hillclimb(domain, provisioning_cost)
    elif sys.argv[3] == 'random':
      cost, sol = optimization.randomoptimize(domain, provisioning_cost)
    elif sys.argv[3] == 'genetic':
      cost, sol = optimization.geneticoptimize(domain, provisioning_cost)
    else:
      raise ValueError('Invalid algorithm')
  else:
      raise ValueError('No algorithm selected')

  result = {'cost': cost, 'solution': sol}
  print result

  #print_solution(sol)

if __name__ == "__main__":
    main()
