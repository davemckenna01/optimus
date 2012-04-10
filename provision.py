import optimization
import pprint

class Provision():

  def __init__(self, resources, resources_labels, consumers, algo):
    self.resources = resources
    self.resources_labels = resources_labels
    self.consumers = consumers
    self.algo = algo

  def optimize(self):

    self.consumers = [[con.strip()] for con in self.consumers.split(',')]
    #append an empty list to each consumer to be filled by resources
    for consumer in self.consumers:
      consumer.append([]);

    #What a solution looks like:
    # [0,1,2,0,2,0,1,0,0,2,1,2,0,0,1,0,2,1,1,0,2,1,0...]
    #where each list slot represents a particular resource
    #from the resources list, and the value of a slot 
    #represents the consumer that resource is assigned to

    #What the domain looks like
    # [(0,2),(0,2),(0,2),(0,2),(0,2),(0,2),(0,2)...]

    domain = [(0,len(self.consumers)-1)] * len(self.resources)

    #Add up the total strength for each attribute possessed by a resource
    total_attr_strengths = []
    for a in range(0, len(self.resources[0]) - 1):
      total_attr_strengths.append(sum([r[a+1] for r in self.resources]))

    #Ideal attribute strength at each consumer.
    #This is simple right now becuase we're just dividing total
    #strengths by # of consumers.
    self.optimal_attr_strengths = []
    for a in range(0, len(total_attr_strengths)):
      self.optimal_attr_strengths.append(total_attr_strengths[a]/len(self.consumers))

    if self.algo == 'annealing':
      cost, sol = optimization.annealingoptimize(domain, self.provisioning_cost)
    elif self.algo == 'hillclimb':
      cost, sol = optimization.hillclimb(domain, self.provisioning_cost)
    elif self.algo == 'random':
      cost, sol = optimization.randomoptimize(domain, self.provisioning_cost)
    elif self.algo == 'genetic':
      cost, sol = optimization.geneticoptimize(domain, self.provisioning_cost)
    else:
      raise ValueError('Invalid algorithm')

    return cost, sol

  def provisioning_cost(self, vec):
    cost = 0

    #Make sure consumers are empty
    for c in range(len(self.consumers)):
      self.consumers[c][len(self.consumers[0])-1] = []

    #Add resources to the consumers based on the solution vector passed in
    for r in range(len(vec)):
      self.consumers[vec[r]][len(self.consumers[0])-1].append(r)

    #Loop through the consumers and determine how strength was 
    #distributed and calculate cost
    for c in range(len(self.consumers)):
      consumer_resources = [self.resources[res] for res in self.consumers[c][len(self.consumers[0])-1]]

      #Add up all the strength of the resources in the consumer
      solution_attr_strengths = []
      for a in range(0, len(self.resources[0]) - 1):
        solution_attr_strengths.append(sum([cr[a+1] for cr in consumer_resources]))

      #Normalize the number to be always non-negative: abs(). B/C whether 
      #the solution over or under supplies the consumer is irrelevant
      for a in range(0, len(solution_attr_strengths)):
        cost += abs(self.optimal_attr_strengths[a] - solution_attr_strengths[a])

    return cost

  #Print out a solution (w/ names of resources and consumers, etc)
  def print_solution(self, vec):

    #Make sure consumers are empty
    for c in range(len(self.consumers)):
      self.consumers[c][len(self.consumers[0])-1] = []

    #Add resources to the consumer
    for r in range(len(vec)):
      self.consumers[vec[r]][len(self.consumers[0])-1].append(r)

    #Pretty print the solution
    for consumer in self.consumers:
      print "=== Consumer: %s ===" % consumer[0] #the consumer "name"
      for res in consumer[len(self.consumers[0])-1]:

        for d in range(0, len(self.resources[0])):
          print "%20s: %s" % (self.resources_labels[d], self.resources[res][d])

      for a in range(0, len(self.resources[0]) - 1):
        total = sum([self.resources[r][a+1] for r in consumer[len(self.consumers[0])-1]])
        print "%s strength at %s: %s" % (self.resources_labels[a+1], consumer[0], total)


