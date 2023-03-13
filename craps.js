let logs = [];

function log(message) {
    console.log(message);
    logs.push(message);
}

class Player {
    /*
    Player standing at the craps table

    Parameters
    ----------
    bankroll : float
        Starting amount of cash for the player, will be updated during play
    bettingStrategy : function(table, player, unit=5)
        A function that implements a particular betting strategy.  See betting_strategies.py
    name : string, optional (default = "Player")
        Name of the player

    Attributes
    ----------
    betsOnTable : list
        List of betting objects for the player
    totalBetAmount : int
        Sum of bet value for the player
     */;

    constructor(bankroll, bettingStrategy=null, name='Player') {
        this.bankroll = bankroll;
        this.bettingStrategy = bettingStrategy;
        this.name = name;
        this.betsOnTable = [];
        this.totalBetAmount = 0;
    }

    bet(bet) {
        if (this.bankroll >= bet.betAmount) {
            this.bankroll -= bet.betAmount;
            this.betsOnTable.push(bet)  
            // TODO: make sure this only happens if that bet isn't on the table, otherwise wager amount gets updated
            this.totalBetAmount += bet.betAmount;
        }
    }
    removeBetByObject(bet) {
        // TODO: add bet attribute for whether a bet can be removed and put condition in here
        let idx = this.betsOnTable.indexOf(bet);
        if (idx > -1) {
            this.bankroll += bet.betAmount;
            this.totalBetAmount -= bet.betAmount;
            this.betsOnTable.splice(idx, 1);
        }
    }

    getBet(name, subname='') {
        /* returns first betting object matching name and bet_subname.
        If bet_subname="Any", returns first betting object matching name */
        return this.betsOnTable.find(bet=>bet.name == name && (bet.subname == subname || bet.subname == 'Any'));
    }

    /*  returns the total number of bets in this.betsOnTable that match bets_to_check  */
    countBets(name) {
        return this.betsOnTable.filter(b=>b.name == name).length;
    }

    remove(name, subname='') {
        for (let i = this.betsOnTable.length - 1; i >= 0; i--) {
            let bet = this.betsOnTable[i];
            if (bet.name == name && bet.subname == subname) {
                this.betsOnTable.splice(i, 1);
            };
        }
    }

    addStrategyBets(table, unit, info) {
        /*  Implement the given betting strategy  */
        return this.bettingStrategy(this, table, unit, info);
    }

    updateBets(table, dice, verbose=false) {
        let info = {};
        for (let i = this.betsOnTable.length - 1; i >= 0; i--) {
            let b = this.betsOnTable[i];
            let betStatus, winAmount;
            [betStatus, winAmount] = b.updateBet(table, dice);
        
            if (betStatus == 'win') {
                this.bankroll += winAmount + b.betAmount;
                this.totalBetAmount -= b.betAmount;
                this.betsOnTable.splice(i, 1);
                if (verbose) {
                    log(`${this.name} won ${winAmount} on ${b.name}${b.subname} bet!`);
                }
            } else if (betStatus == 'lose') {
                this.totalBetAmount -= b.betAmount;
                this.betsOnTable.splice(i, 1);
                if (verbose) {
                    log(`${this.name} lost ${b.betAmount} on ${b.name}${b.subname} bet.`);
                }
            } else if (betStatus == 'push') {
                this.bankroll += b.betAmount;
                this.totalBetAmount -= b.betAmount;
                this.betsOnTable.splice(i, 1);
                if (verbose) {
                    log(`${this.name} pushed ${b.betAmount} on ${b.name}${b.subname} bet.`);
                }
            }
            info[b.name] = {'betStatus': betStatus, 'winAmount': winAmount};
        };
        return info;
    }

}


class Dice {
    /**
     * 
     * Simulate the rolling of a dice

    Parameters
    ----------
    NONE

    Attributes
    ----------
    numberOfRolls : int
        Number of rolls for the dice
    result : array, shape = [2]
        Most recent outcome of the roll of two dice
    total : int
        Sum of dice outcome
     */

    numberOfRolls = 0
    result = [];
    total = 0;

    nextDie() {
        return Math.floor(Math.random() * 6) + 1;
    }

    roll() {
        this.numberOfRolls++;
        this.result = [this.nextDie(), this.nextDie()];
        this.total = this.result[0] + this.result[1];
    }
}

class FakeDice extends Dice {
    /**
     *  Instantiate with a list of lists of 2 numbers
     *  Those numbers will be used. When they run out, will revert to rolling randomly
     * 
     */
    constructor(rolls) {
        super();
        this.rolls = rolls;
    }
    
    roll() {
        if (this.rolls.length) {
            this.numberOfRolls++;
            this.result = this.rolls.shift();
            this.total = this.result[0] + this.result[1];    
        } else {
            super.roll();
        }  
    }
}

class Table {
    /**
     *     Craps Table that contains Dice, Players, the Players' bets, and updates
    them accordingly.  Main method is run() which should simulate a craps
    table until a specified number of rolls plays out or all players run out
    of money.

    Parameters
    ----------
    NONE

    Attributes
    ----------
    players : list
        List of player objects at the table
    totalPlayerCash : float
        Sum of all players bankroll and bets on table
    point : string
        The point for the table.  It is either "Off" when point is off or "On"
        when point is on.
    pointNumber : int
        The point number when point is "On" and None when point is "Off"
    playerHasBets : bool
        Boolean value for whether any player has a bet on the table.
    strategyInfo : dictionary
        Contains information stored from the strategy, usually mean for
        strategies that alter based on past information
    betUpdateInfo : dictionary
        Contains information from updating bets, for given player and a bet
        name, this is status of last bet (win/loss), and win amount.

     */

    constructor(dice) {
        this.players = [];
        this.playerHasBets = false;
        // TODO: I think strategyInfo should be attached to each player object
        this.strategyInfo = {};
        this.point = null;
        this.dice = dice || new Dice();
        this.betUpdateInfo = null;
        this.payouts = {"fielddouble": [2, 12], "fieldtriple": []};
        this.passRolls = 0;
        this.lastRoll = null;
        this.numberOfShooters = 1;
    }

    static POINTS = [4, 5, 6, 8, 9, 10];

    hasPoint() {
        return this.point;
    }

    setPayouts(name, value) {
        this.payouts[name] = value;
    }

    addPlayer(player) {
        // Add player object to the table
        if (this.players.includes(player)) {
            return;
        }
        this.players.push(player);
        this.strategyInfo[player] = null;
    }

    run(maxRolls, maxShooters=Infinity, verbose=true, runout=false) {
    /**
     *  Runs the craps table until a stopping condition is met.

        Parameters
        ----------
        maxRolls : int
            Maximum number of rolls to run for
        verbose : bool
            If true, print results from table during each roll
        runout : bool
            If true, continue past maxRolls until player has no more bets on the table
     *  
     */        
        if (verbose)
            log("Welcome to the Craps Table!");

        // make sure at least one player is at table
        if (this.players.length == 0)
            this.addPlayer(Player(500, "Player1"));
        if (verbose) {
            log("Initial players:");
            this.players.forEach(p=>log(p.name));
        }
            

        // maybe wrap this into update table or something
        this.totalPlayerCash = 0;
        this.players.forEach(p=>this.totalPlayerCash += p.totalBetAmount + p.bankroll);

        let continueRolling = true;
        while (continueRolling) {

            // players make their bets
            this.addPlayerBets();
            if (verbose) {
                this.players.forEach(p=>{
                    log("Player:" + p.name + ' ' + p.betsOnTable.map(b=>`${b.name}${b.subname}:${b.betAmount}`).join(' '));
                    
                });
            }

            this.dice.roll();
            if (verbose) {
                log("")
                log("Dice out!", !this.hasPoint() ? " -- Come out roll" : "");
                log(`Shooter rolled ${this.dice.total} ${this.dice.result}`);
            }
            this.updatePlayerBets(this.dice, verbose);
            this.updateTable(this.dice);
            if (verbose) {
                log(`Point is ${this.point ? "On" : "Off"} (${this.point})`);
                log(`Total Player Cash is ${this.totalPlayerCash}`);
            }

            // evaluate the stopping condition
            if (runout) {
                continueRolling = (
                    this.dice.numberOfRolls < maxRolls
                    && this.numberOfShooters <= maxShooters
                    && this.totalPlayerCash > 0
                ) || this.playerHasBets;
            } else {
                continueRolling = (
                    this.dice.numberOfRolls < maxRolls
                    && this.numberOfShooters <= maxShooters
                    && this.totalPlayerCash > 0
                )
            }
        }
    };

    addPlayerBets() {
        /**
         *         """ Implement each player's betting strategy """
        """ TODO: restrict bets that shouldn't be possible based on table"""
        """ TODO: Make the unit parameter specific to each player, and make it more general """

         */  
        this.players.forEach(p=>{
            this.strategyInfo[p] = p.addStrategyBets(
                this, 5, this.strategyInfo[p]
            );
        });
    }

    updatePlayerBets(dice, verbose=false) {
    /**
     * check bets for wins/losses, payout wins to their bankroll, remove bets that have resolved
     */        
        this.betUpdateInfo = {};
        this.players.forEach(p=>{
            this.betUpdateInfo[p] = p.updateBets(this, dice, verbose);
        });
    }

    updateTable(dice) {
        /**
         * update table attributes based on previous dice roll
         */
        this.passRolls += 1
        if (this.hasPoint() && dice.total == 7)
            this.numberOfShooters += 1;
        if (this.hasPoint() && (dice.total == 7 || dice.total == this.point))
            this.passRolls = 0;

        if (this.point && [7, this.point].includes(dice.total)) {
            this.point = null;
        } else if (!this.point && Table.POINTS.includes(dice.total)) {
            this.point = dice.total;
        }

        this.totalPlayerCash = 0;
        this.playerHasBets = false;
        this.players.forEach(p=>{
            this.totalPlayerCash += p.totalBetAmount + p.bankroll;
            this.playerHasBets |= p.betsOnTable.length;
        });
        this.lastRoll = dice.total;
    }

    getPlayer(name) {
        return this.players.find(p=>p.name == name);
    }
}



function calculateOddsBet(number, unit=5, win_mult=1) {
    if (win_mult == '345') {
        if ([4, 10].includes(number)) {
            amount = unit * 3;
        } else if ([5, 9].includes(number)) {
            amount = unit * 4;
        } else if ([6, 8].includes(number)) {
            amount = unit * 5;
        }
    } else {
        amount = unit * win_mult;
    }
    force_multiple = 1;
    if ([5, 9].includes(number)) {
        force_multiple = 2;
    } else if ([6, 8].includes(number)) {
        force_multiple = 5;
    }
    return amount + (amount % force_multiple);
}

function calculateLayOddsBet(number, unit=5, win_mult=1) {
    // Lay odds for don't pass
    if (win_mult == '345') {
        if ([4, 10].includes(number)) {
            mult = 3;
        } else if ([5, 9].includes(number)) {
            mult = 4;
        } else if ([6, 8].includes(number)) {
            mult = 5;
        }
    } else {
        mult = win_mult;
    }
    if ([4, 10].includes(number)) {
        mult = 2 * mult;
    } else if ([5, 9].includes(number)) {
        mult = 3 / 2 * mult;
    } else if ([6, 8].includes(number)) {
        mult = 6 / 5 * mult;
    }
    force_multiple = 2;
    if ([5, 9].includes(number)) {
        force_multiple = 3;
    } else if ([6, 8].includes(number)) {
        force_multiple = 6;
    }
    amount = mult * unit;
    return amount + (amount % force_multiple);
}

function calculatePlaceBet(number, unit=5) {
    let factor = 5;
    if ([6,8].includes(number)) {
        factor = 6;
    }
    if (unit % factor == 0) {
        return unit;
    }
    return unit + (factor - unit % factor);
}

ALL_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

class Bet {
    /*
    A generic bet for the craps table

    Parameters
    ----------
    betAmount : float
        Wagered amount for the bet

    Attributes
    ----------
    name : string
        Name for the bet
    subname : string
        Subname, usually denotes number for a come/don't come bet
    winning_numbers : list
        Numbers to roll for this bet to win
    losing_numbers : list
        Numbers to roll that cause this bet to lose
    payoutratio : float
        Ratio that bet pays out on a win
    commission: float
        Commission paid to make a bet

     */;

    name = null;
    subname = '';
    winning_numbers = [];
    losing_numbers = [];
    payoutratio = 1;
    commission = 0;
    offOnComeOut = false;

    // TODO: add whether bet can be removed

    constructor(betAmount) {
        this.betAmount = betAmount;
    }
    // def __eq__(other):
    //     return this.name == other.name

    updateBet(table, dice) {
        let status = null;
        let win_amount = 0;
    
        if (this.offOnComeOut && !table.hasPoint()) {
            return [status, win_amount];
        }
        if (this.winning_numbers.includes(dice.total)) {
            status = 'win';
            win_amount = this.payoutratio * this.betAmount;
            if (this.commission > 0) {
                win_amount -= Math.max(Math.floor(this.betAmount * this.commission), 1);
            }
        } else if (this.losing_numbers.includes(dice.total)) {
            status = 'lose';
        }
        return [status, Math.floor(win_amount)];
    }
}

/*
Passline and Come bets
 */

class PassLine extends Bet {
    // TODO: make this require that table_object.point = "Off",
    // probably better in the player module
    constructor(betAmount) {
        super(betAmount);
        this.name = 'PassLine';
        this.winning_numbers = [7, 11];
        this.losing_numbers = [2, 3, 12];
        this.payoutratio = 1.0;
        this.prepoint = true;
    }
    updateBet(table_object, dice_object) {
        let status, win_amount;
        [status, win_amount] = [null, 0];
    
        if (this.winning_numbers.includes(dice_object.total)) {
            status = 'win';
            win_amount = this.payoutratio * this.betAmount;
        } else if (this.losing_numbers.includes(dice_object.total)) {
            status = 'lose';
        } else if (this.prepoint) {
            this.winning_numbers = [dice_object.total];
            this.losing_numbers = [7];
            this.prepoint = false;
        }
        return [status, win_amount];
    }
}

class Come extends PassLine {
    constructor(betAmount) {
        super(betAmount);
        this.name = 'Come';
    }
    updateBet(table_object, dice_object) {
        let status, win_amount;
        [status, win_amount] = super.updateBet(table_object, dice_object);
        if (!this.prepoint && this.subname == '') {
            this.subname = [this.winning_numbers].join('');
        }
        return [status, win_amount];
    }

}

class Odds extends Bet {
    constructor(betAmount, bet_object) {
        super(betAmount);
        this.name = 'Odds';
        this.subname = [bet_object.winning_numbers].join('');
        this.winning_numbers = bet_object.winning_numbers;
        this.losing_numbers = bet_object.losing_numbers;
        this.offOnComeOut = true;
    
        if (this.winning_numbers == [4] || this.winning_numbers == [10]) {
            this.payoutratio = 2 / 1;
        } else if (this.winning_numbers == [5] || this.winning_numbers == [9]) {
            this.payoutratio = 3 / 2;
        } else if (this.winning_numbers == [6] || this.winning_numbers == [8]) {
            this.payoutratio = 6 / 5;
        }
    }
}

class Buy extends Bet {
    constructor(betAmount, number) {
        super(betAmount);
        this.name = 'Buy';
        this.subname = number;
        this.commission = 0.05;
        this.winning_numbers = [number];
        this.losing_numbers = [7];
        this.offOnComeOut = true;
    
        if (this.winning_numbers == [4] || this.winning_numbers == [10]) {
            this.payoutratio = 2 / 1;
        } else if (this.winning_numbers == [5] || this.winning_numbers == [9]) {
            this.payoutratio = 3 / 2;
        } else if (this.winning_numbers == [6] || this.winning_numbers == [8]) {
            this.payoutratio = 6 / 5;
        }
    }
    updateBet(table, dice_object) {
        // buy bets are inactive when point is "Off"
        if (table.hasPoint()) {
            return super.updateBet(table, dice_object);
        } else {
            return [null, 0];
        }
    }
}

class Place extends Bet {
    constructor(betAmount, number) {
        super(betAmount);
        this.name = "Place";
        this.subname = "" + number;
        this.offOnComeOut = true;
        this.losing_numbers = [7];
        this.winning_numbers = [number];

        if ([4, 10].includes(number)) {
            this.payoutratio = 9 / 5;
        } else if ([5, 9].includes(number)) {
            this.payoutratio = 7 / 5;
        } else if ([6, 8].includes(number)) {
            this.payoutratio = 7 / 6;
        }
    }
}

class Field extends Bet {
    /*
    Parameters
    ----------
    double : list
        Set of numbers that pay double on the field bet (default = [2,12])
    triple : list
        Set of numbers that pay triple on the field bet (default = [])
     */

    constructor(betAmount, double=[2, 12], triple=[]) {
        super(betAmount);
        this.name = 'Field';
        this.double_winning_numbers = double;
        this.triple_winning_numbers = triple;
        this.winning_numbers = [2, 3, 4, 9, 10, 11, 12];
        this.losing_numbers = [5, 6, 7, 8];
    }
    updateBet(table_object, dice_object) {
        let status = null;
        let win_amount = 0;
    
        if (this.triple_winning_numbers.includes(dice_object.total)) {
            status = 'win';
            win_amount = 3 * this.betAmount;
        } else if (this.double_winning_numbers.includes(dice_object.total)) {
            status = 'win';
            win_amount = 2 * this.betAmount;
        } else if (this.winning_numbers.includes(dice_object.total)) {
            status = 'win';
            win_amount = 1 * this.betAmount;
        } else if (this.losing_numbers.includes(dice_object.total)) {
            status = 'lose';
        }
        return [status, win_amount];
    }
}


/*
Don't pass and Don't come bets
 */


class DontPass extends Bet {
    // TODO: make this require that table_object.point = "Off",
    //  probably better in the player module
    constructor(betAmount) {
        super(betAmount);
        this.name = 'DontPass';
        this.winning_numbers = [2, 3];
        this.losing_numbers = [7, 11];
        this.push_numbers = [12];
        this.payoutratio = 1.0;
        this.prepoint = true;
    }
    updateBet(table_object, dice_object) {
        let status = null;
        let win_amount = 0;
    
        if (this.winning_numbers.includes(dice_object.total)) {
            status = 'win';
            win_amount = this.payoutratio * this.betAmount;
        } else if (this.losing_numbers.includes(dice_object.total)) {
            status = 'lose';
        } else if (this.push_numbers.includes(dice_object.total)) {
            status = 'push';
        } else if (this.prepoint) {
            this.winning_numbers = [7];
            this.losing_numbers = [dice_object.total];
            this.push_numbers = [];
            this.prepoint = false;
        }
        return [status, win_amount];
    }
}

class DontCome extends DontPass {
    constructor(betAmount) {
        super(betAmount);
        this.name = 'DontCome';
    }
    updateBet(table_object, dice_object) {
        [status, win_amount] = super.updateBet(table_object, dice_object);
        if (!this.prepoint && this.subname == '') {
            this.subname = this.losing_numbers.join('');
            return [status, win_amount];
        }
    }

}

class LayOdds extends Bet {
    constructor(betAmount, bet_object) {
        super(betAmount);
        this.name = 'LayOdds';
        this.subname = bet_object.losing_numbers.join('');
        this.winning_numbers = bet_object.winning_numbers;
        this.losing_numbers = bet_object.losing_numbers;
        this.offOnComeOut = true;
    
        if (this.losing_numbers == [4] || this.losing_numbers == [10]) {
            this.payoutratio = 1 / 2;
        } else if (this.losing_numbers == [5] || this.losing_numbers == [9]) {
            this.payoutratio = 2 / 3;
        } else if (this.losing_numbers == [6] || this.losing_numbers == [8]) {
            this.payoutratio = 5 / 6;
        }
    }
}

class AnyCraps extends Bet {
    constructor(betAmount) {
        super(betAmount);
        this.name = 'AnyCraps';
        this.subname = '';
        this.winning_numbers = [2, 3, 12];
        this.losing_numbers =  ALL_NUMBERS.filter(x=>!this.winning_numbers.includes(x));
    
        this.payoutratio = 7;
    }
}

class AnySeven extends Bet {
    constructor(betAmount) {
        super(betAmount);
        this.name = 'AnySeven';
        this.subname = '';
        this.winning_numbers = [7];
        this.losing_numbers =  ALL_NUMBERS.filter(x=>!this.winning_numbers.includes(x));

        this.payoutratio = 4;
    }
}

class Horn12 extends Bet {
    constructor(betAmount) {
        super(betAmount);
        this.name = 'Horn12';
        this.subname = '';
        this.winning_numbers = [12];
        this.losing_numbers =  ALL_NUMBERS.filter(x=>!this.winning_numbers.includes(x));
        this.payoutratio = 30;
    }
}
class Horn2 extends Bet {
    constructor(betAmount) {
        super(betAmount);
        this.name = 'Horn2';
        this.subname = '';
        this.winning_numbers = [2];
        this.losing_numbers =  ALL_NUMBERS.filter(x=>!this.winning_numbers.includes(x));
        this.payoutratio = 30;
    }
}
class Horn3 extends Bet {
    constructor(betAmount) {
        super(betAmount);
        this.name = 'Horn3';
        this.subname = '';
        this.winning_numbers = [3];
        this.losing_numbers =  ALL_NUMBERS.filter(x=>!this.winning_numbers.includes(x));
        this.payoutratio = 15;
    }
}

class Horn11 extends Bet {
    constructor(betAmount) {
        super(betAmount);
        this.name = 'Horn11';
        this.subname = '';
        this.winning_numbers = [11];
        this.losing_numbers =  ALL_NUMBERS.filter(x=>!this.winning_numbers.includes(x));
        this.payoutratio = 15;
    }
}

class Hard extends Bet {
    constructor(number, betAmount) {
        super(betAmount);
        if (number % 2 != 0)
            throw new Error('Bad value for hardway:' + number);
        this.name = 'Hard';
        this.subname = number;
        this.winning_result = [number, number].join('');
        this.losing_results = [number, 7];
        this.payoutratio = (number == 4 || number == 10) ? 7 : 9;
        this.offOnComeOut = true;
    }

    updateBet(table, dice) {
        let status = null;
        let win_amount = 0;
        if (this.offOnComeOut && !table.hasPoint()) {
            return [status, win_amount];
        }
        let result = dice.result.join('');
        if (result == this.winning_result) {
            status = 'win';
            win_amount = this.payoutratio * this.betAmount;
        } else if (this.losing_results.includes(dice.total)) {
            status = 'lose';
        }
        return [status, Math.floor(win_amount)];
    }
}

class Hop extends Bet {
    constructor(twodice, betAmount) {
        super(betAmount);
        this.name = 'Hop';
        this.subname = twodice;
        this.winning_results = [this.subname, this.subname.split('').reverse().join('')];
        this.payoutratio = (twodice[0] == twodice[1]) ? 30 : 15;
    }

    updateBet(table, dice) {
        let status = null;
        let win_amount = 0;
    
        let result = dice.result.join('');
        if (this.winning_results.includes(result)) {
            status = 'win';
            win_amount = this.payoutratio * this.betAmount;
        } else {
            status = 'lose';
        }
        return [status, Math.floor(win_amount)];
    }
}

class Simulation {
    constructor(numOfRuns=5000, maxRolls=200, maxShooters=20, bankroll=200, strategy=passline) {
        this.numOfRuns = numOfRuns;
        this.maxRolls = maxRolls;
        this.maxShooters = maxShooters;
        this.bankroll = bankroll;
        this.strategy = strategy;
    }

    printout() {
        let table = new Table();
        table.addPlayer(new Player(this.bankroll, this.strategy));
        table.run(this.maxRolls, this.maxShooters);
    }

    run() {
        let results = [];
        let output = {};
        for (let i = 0; i < this.numOfRuns; i++) {
            let table = new Table();
            table.addPlayer(new Player(this.bankroll, this.strategy));
            table.run(this.maxRolls, this.maxShooters, verbose=false);
            log(`${i},${table.totalPlayerCash},${this.bankroll},${table.dice.numberOfRolls}`);
            results.push([i, table.totalPlayerCash, this.bankroll, table.dice.numberOfRolls]);
            // let bucket = Math.floor(table.totalPlayerCash / 5);
            let bucket = table.totalPlayerCash;
            output[bucket] = (output[bucket] || 0) + 1;
        }
        return output;
    }
}



        // results = pd.DataFrame(results, columns = ['sim', 'final', 'initial', 'n_rolls'])
        // results['winnings'] = results['final'] - results['initial']
        // p = (
        //     ggplot(results, aes(x='winnings')) + 
        //     geom_vline(xintercept = 0, color = 'grey') + 
        //     geom_density() +
        //     theme_classic() + 
        //     labs(x = "Winnings", y = "Relative chance of outcome", title = "Bankroll:" + str(self.bankroll) + " Sims:" + str(self.num_of_runs) + " MaxShooter:" + str(self.max_shooters) + " MaxRolls:" + str(self.max_rolls))
        // )
        // ggsave(plot = p, filename = sim_name, path = "./output/simulations/")
        // # print("Sum of output density",sum(output_density.values()))
        // # print("Max of output density",max(output_density.values()))
        // # print("Min of output density keys",min(output_density.keys()))
        // # print("Max of output density keys",max(output_density.keys()))
        // # print(output_density)
        // return output_density


function passline(player, table, unit=5, strat_info=null) {
    if (!table.hasPoint() && !player.getBet("PassLine"))
        player.bet(new PassLine(unit));
}

function passline_odds(player, table, unit=5, strat_info=null, win_mult=1) {
    passline(player, table, unit);
    if (!table.hasPoint())
        return;
    let passlineBet = player.getBet("PassLine");
    if (!passlineBet)
        return;
    if (player.getBet("Odds", table.point))
        return;
    player.bet(new Odds(calculateOddsBet(table.point, unit=unit, win_mult=win_mult), passlineBet));
}

function dontpass(player, table, unit=5, strat_info=null) {
    // Don't pass bet
    if (!table.hasPoint() && ! player.getBet("DontPass"))
        player.bet(new DontPass(unit))
}

function dontpass_odds(player, table, unit=5, strat_info=null, win_mult=1) {
    // Assume that someone tries to win the `win_mult` times the unit on each bet, which corresponds
    // well to the max_odds on a table.
    // For `win_mult` = "345", this assumes max of 3-4-5x odds
    dontpass(player, table, unit);

    if (table.hasPoint()) {
        let dontPassBet = player.getBet("DontPass");
        if (dontPassBet && !player.getBet("LayOdds", table.point)) {
            player.bet(new LayOdds(calculateLayOddsBet(table.point, unit=unit, win_mult=win_mult), dontPassBet));
        }
    }
}

function place5689(player, table, unit=5, strat_info=null) {
    if (!table.hasPoint())
        return;

    [5, 6, 8, 9].forEach(n=>{
        if (player.getBet("Place", n))
            return;
        player.bet(new Place(calculatePlaceBet(n, unit), n));
    })
}

function ironcross(player, table, unit=5, strat_info=null) {
    passline(player, table, unit);
    passline_odds(player, table, unit, strat_info=null, win_mult=2);

    [5, 6, 8].forEach(n=>{
        if (player.getBet("Place", n))
            return;
        player.bet(new Place(calculatePlaceBet(n, unit * 2), n));
    });

    if (table.hasPoint() && !player.getBet("Field")) {
        player.bet(new Field(unit));
    }
}

function hammerlock(player, table, unit=5, strat_info=null) {
    passline(player, table, unit);
    dontpass_odds(player, table, unit, win_mult="345");

    if (!strat_info || !table.hasPoint()) {
        strat_info = {"mode": "place68"};
        player.remove("Place");
    }

    let placesCount = player.countBets("Place");
    if (strat_info.mode == "place68") {
        // We have place bets up, but not all, so one of them won
        if (table.hasPoint() && placesCount > 0 && placesCount < 2) {
            player.remove("Place");
            strat_info.mode = "place_inside";
            [5, 6, 8, 9].forEach(n=>{
                if (player.getBet("Place", n)) {
                    return;
                }
                player.bet(new Place(calculatePlaceBet(n, unit), n));
            });
        } else {
            [6, 8].forEach(n=>{
                if (player.getBet("Place", n)) {
                    return;
                }
                player.bet(new Place(calculatePlaceBet(n, unit * 2), n));
            });
        }
    } else if (strat_info.mode == "place_inside") {
        if (table.hasPoint() && placesCount > 0 && placesCount < 4) {
            // one of our place bets won. Take them all down
            player.remove("Place");
            strat_info.mode = "takedown";
        } else {
            [5, 6, 8, 9].forEach(n=>{
                if (player.getBet("Place", n)) {
                    return;
                }
                player.bet(new Place(calculatePlaceBet(n, unit * 2), n));
            });
        }
    } else if (strat_info.mode == "takedown" && !table.hasPoint()) {
        strat_info = null;
    }

    return strat_info;
}

function buy_4_10(player, table, unit=5, strat_info=null) {
    if (!table.hasPoint()) {
        return;
    }
    [4, 10].forEach(n=>{
        if (!player.getBet('Buy', n)) {
            player.bet(new Buy(unit, n));
        }
    });
}

function hardways(player, table, unit=5, strat_info=null) {
    [4, 6, 8, 10].forEach(n=>{
        if (!player.getBet("Hard", n)) {
            player.bet(new Hard(n, unit));
        }        
    });
}

function pass_dontpass_horn12(player, table, unit=5, strat_info=null) {
    passline(player, table, unit);
    dontpass(player, table, unit);

    let mult = table.dice.total == 12 ? 10 : 1;
    player.bet(new Horn12(unit * mult));
}

function pass_2come(player, table, unit=5, strat_info=null) {
    passline_odds(player, table, unit);
    this.betsOnTable.filter(b=>b.name == "Come" && b.subname).forEach(b=>{
        if (!player.getBet("Odds", b.subname)) {
            player.bet(new Odds(unit, b));
        }
     });
     if (player.countBets("Come") < 2) {
        player.bet(new Come(unit));
    }
}

function mike_harris(player, table, unit=5, strat_info=null) {
    // dont pass bet with max odds laid
    dontpass_odds(player, table, unit=unit, strat_info, win_mult="345")

    if (table.hasPoint()) {
        // Odds on any come bet that has established a point
        this.betsOnTable.filter(b=>b.name == "Come" && b.subname).forEach(b=>{
            if (!player.getBet("Odds", b.subname)) {
                player.bet(new Odds(unit, b));
            }
        });
        // place inside numbers (unless come bet exists on that number)
        [5, 6, 8, 9].forEach(n=>{
            if (!player.getBet("Odds", n) && !player.getBet("Place", n)) {
                player.bet(new Place(unit, n));
            }
        });
        [4, 10].forEach(n=>{
            if (!player.getBet("Odds", n) && !player.getBet("Buy", n)) {
                player.bet(new Buy(unit, n));
            }
        });
        // If point is hard way, bet that hard way
        if (table.point % 2 == 0 && !player.getBet("Hard", table.point)) {
            player.bet("Hard", table.point);
        }

        // If at least 3 come bets are established, or 2 come bets and one of them is on 4 or 10, hop the sevens
        let comeBetCount = player.countBets("Come");
        let hopAmount = 0;
        if (comeBetCount > 2) {
            hopAmount = Math.ceil(unit/3) + comeBetCount - 3;
        } else if (comeBetCount > 1 && (player.getBet("Come", 4) || player.getBet("Come", 10))) {
            hopAmount = Math.ceil(unit/3) + comeBetCount - 2;
        }

        if (hopAmount > 0) {
            player.bet(new Hop("16", hopAmount));
            player.bet(new Hop("25", hopAmount));
            player.bet(new Hop("34", hopAmount));
        }

        // Add a come bet every roll
        player.bet(new Come(unit));


    }
}
/**
 * 
 * current_numbers = []
for bet in player.bets_on_table:
    current_numbers += bet.winning_numbers
current_numbers = list(set(current_numbers))

if table.point == "On":
    # Put odds on any come bets
    for bet in player.bets_on_table:
        if bet.name == "Come" and bet.subname:
            if not player.has_bet("Odds", bet.subname):
                player.bet(Odds(unit, bet))


    # Always run a come bet
    player.bet(Come(unit))

    # always place 5, 6, 8, 9 when they aren't come bets or place bets already
    if 5 not in current_numbers and 5 != table.point.number:
        player.bet(Place5(unit))
    if 6 not in current_numbers and 6 != table.point.number:
        player.bet(Place6(6 / 5 * unit))
    if 8 not in current_numbers and 8 != table.point.number:
        player.bet(Place8(6 / 5 * unit))
    if 9 not in current_numbers and 9 != table.point.number:
        player.bet(Place9(unit))

    # buy the 4 and 10 if not already covered
    if 4 not in current_numbers and 4 != table.point.number:
        player.bet(Buy(unit, 4))
    if 10 not in current_numbers and 10 != table.point.number:
        player.bet(Buy(unit, 10))

if table.point == "On" and table.point.number % 2 == 0 and player.get_bet("Hard", table.point.number) == None:
    player.bet(Hard(table.point.number, unit))

# hop each of the 3 sevens when you have established 2 Come bets (one of which is 4/10) or 3 come bets
# start with 5 each hop, +1 for every other established come bet
# at $5 table, can start the hop at $1
come_bets = len([x for x in player.bets_on_table if x.name == 'Come' and x.subname])

# one of those come bets, by definition, is not established
hop_the_seven = come_bets > 2
if not hop_the_seven and come_bets > 1 and (player.has_bet("Come", "4") or player.has_bet("Come", "10")):
    hop_the_seven = True

if hop_the_seven:
    hop_amount = math.ceil(unit/3) + max(0, come_bets - 4)
    player.bet(Hop("16", hop_amount))
    player.bet(Hop("25", hop_amount))
    player.bet(Hop("34", hop_amount))
 */



// dice = new FakeDice([[5,5],[5,4],[5,3],[5,2]]);
// table = new Table(new Dice());
// table.addPlayer(new Player(500, mike_harris, 1));
// table.run(100, 20, verbose=true)

let outputs = [];
[mike_harris, pass_2come, pass_dontpass_horn12, hammerlock, dontpass_odds].forEach(strategy=>{
    let sim = new Simulation(1000, 200, 20, 500, strategy);
    //sim.printout();
    outputs.push(sim.run());
})
console.log(outputs);
