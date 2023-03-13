This project borrows heavily from https://github.com/skent259/crapssim

I converted their python code to js to allow running it in a browser.

I've also made some modifications to the data model to facilitate what I would like to do.

In the end, I hope to have a web page that will allows a user to build various strategies and compare them in simulations.

Things I hope to accomplish in this project
* Prefer to have simulations run all strategies at the same time, so you'll get a truer comparison of their effectiveness.
* Create a strategy object which contains bets organized by rules
* Keep track of more per shooter statistics, for use in Strategy rules
* Strategies should be able to keep track of bets that have won (for the current shooter)
* Build a web ui that allows user to build and run strategies
* Allow user to specify dice rolls so they can see how their strategy works


