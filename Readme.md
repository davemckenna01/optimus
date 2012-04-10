# Optimus

Optimus is a web interface for running a specific type of optimization on a specific type of input.

## Use Case

In any case when you have a set of resources that need to be distributed among various "consumers" of those resources, optimus will help you arrive at an optimal configuration.

## Example

Say you have 50 servers each with varying amounts of ram and cpu available. Some servers have 512 ram available, some 256, some have X processing available, some have Y, etc. And say you want to distribute those computing resources among 4 different clusters so that all 4 clusters are as equally equipped as possible.

The number of combinations that are possible is extremely huge - in the trillions - making it expensive to use "brute force" techniques to calculate a solution.

Optimus uses smart optimization algorithms to come to a "pretty good" solution, in a fraction of a fraction of the time it would take to brute force it.

## Algorithms

[Genetic](http://en.wikipedia.org/wiki/Genetic_algorithm)
[Simulated Annealing](http://en.wikipedia.org/wiki/Simulated_annealing)
[Hill Climbing](http://en.wikipedia.org/wiki/Hill_climbing)
[Random](http://en.wikipedia.org/wiki/Random_optimization)

## Try it out
[optimusapp.appspot.com](http://optimusapp.appspot.com)
