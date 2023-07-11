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
        this.startingBankroll = bankroll;
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
        return this.bettingStrategy.update(this, table, unit, info);
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
        this.shooterNaturals = 0;
        this.shooterPoints = 0;
        this.rollDistribution = Array(13).fill(0);
    }

    static POINTS = [4, 5, 6, 8, 9, 10];

    hasPoint() {
        return this.point > 0;
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

    run(maxRolls, maxShooters=Infinity, verbose=true) {
    /**
     *  Runs the craps table until a stopping condition is met.

        Parameters
        ----------
        maxRolls : int
            Maximum number of rolls to run for
        verbose : bool
            If true, print results from table during each roll
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
        this.players.forEach(p=>this.totalPlayerCash += parseInt(p.totalBetAmount) + parseInt(p.bankroll));

        let continueRolling = true;
        while (continueRolling) {

            // players make their bets
            this.addPlayerBets();
            if (verbose) {
                log("*** Preparing for next roll.. adding player bets");
                this.players.forEach(p=>{
                    let totalBetsOnTable = 0;
                    p.betsOnTable.forEach(b=>totalBetsOnTable += b.betAmount);
                    log("Player:" + p.name + ' Bankroll:' + p.bankroll 
                    + ' Bets:' + p.betsOnTable.sort((a,b)=>(a.subname + a.name).localeCompare(b.subname + b.name)).map(b=>`${b.name}${b.subname}:${b.betAmount}`).join(' ')
                    + ' Total Bets:' + totalBetsOnTable);
                });
            }

            this.dice.roll();
            this.rollDistribution[this.dice.total] += 1;
            if (verbose) {
                log("Dice out!" + (!this.hasPoint() ? " -- Come out roll" : ""));
                log(`Shooter rolled ${this.dice.total} ${this.dice.result}`);
            }
            this.updatePlayerBets(this.dice, verbose);
            this.updateTable(this.dice);
            if (verbose) {
                log(`Point is ${this.point ? "On" : "Off"} (${this.point})`);
                log(`Total Cash On Table (bets plus bankroll) is ${this.totalPlayerCash}`);
            }

            // evaluate the stopping condition
            continueRolling =
                this.numberOfShooters <= maxShooters
                && this.totalPlayerCash > 0;
        }
        if (verbose) {
            log("Player ending bankrolls: " + this.players.map(p=>p.name + ':' + p.bankroll + ' ').join(' '))
            log("Roll Distribution:" +  this.rollDistribution.splice(2));
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
        if (this.hasPoint()) {
            if (dice.total == 7) {
                this.numberOfShooters += 1;
                this.shooterNaturals = 0;
                this.shooterPoints = 0;            
                this.passRolls = 0;
            } else if (dice.total == this.point) {
                this.shooterPoints += 1;
                this.passRolls = 0;
            }
        }

        if (this.hasPoint() && [7, this.point].includes(dice.total)) {
            this.point = null;
        } else if (!this.hasPoint() && Table.POINTS.includes(dice.total)) {
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
    offOnComeOut : boolean
        The bet is not working on the come out roll
    comeOutRollPush : boolean
        If bet is off, and would have won or lost on come out roll, push the bet. 
        This is necessary for odds bets where the underlying bet is taken down.
        If this is true, off on come out must be true

     */;

    name = null;
    subname = '';
    winning_numbers = [];
    losing_numbers = [];
    payoutratio = 1;
    commission = 0;
    offOnComeOut = false;
    comeOutRollPush = false;

    // TODO: add whether bet can be removed

    constructor(betAmount) {
        this.betAmount = betAmount;
    }

    updateBet(table, dice) {
        let status = null;
        let win_amount = 0;
    
        if (this.offOnComeOut && !table.hasPoint()) {
            if (this.comeOutRollPush && (this.winning_numbers.includes(dice.total) || this.losing_numbers.includes(dice.total))) {
                status = 'push';
            }
            return [status, win_amount];
        }
        if (this.winning_numbers.includes(dice.total)) {
            status = 'win';
            let commissionAmount = 0;
            if (this.commission > 0) {
                commissionAmount = Math.max(Math.floor(this.betAmount * this.commission), 1);
            }
            win_amount = this.payoutratio * (this.betAmount - commissionAmount);
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
    constructor(betAmount, number) {
        super(betAmount);
        number = parseInt(number);
        this.name = 'Odds';
        this.subname = number;
        this.winning_numbers = [number];
        this.losing_numbers = [7];
        this.offOnComeOut = true;
    
        switch (parseInt(number)) {
            case 4:
            case 10:
                this.payoutratio = 2 / 1;
                break;
            case 5:
            case 9:
                this.payoutratio = 3 / 2;
                break;
            case 6:
            case 8:
                this.payoutratio = 6 / 5;
                break;
        }
    }

    // updateBet(table, dice) {
    //     if (this.offOnComeOut && !table.hasPoint() && (
    //         this.winning_numbers.includes(dice.total) || this.losing_numbers.includes(dice.total)
    //     )) {
    //         return ['push', 0];
    //     }
    //     return super.updateBet(table, dice);
    // }
}

class LayOdds extends Bet {
    constructor(betAmount, number) {
        super(betAmount);
        number = parseInt(number);
        this.name = 'LayOdds';
        this.subname = number;
        this.winning_numbers = [7];
        this.losing_numbers = [number];
        this.offOnComeOut = true;
    
        switch (parseInt(number)) {
            case 4:
            case 10:
                this.payoutratio = 1 / 2;
                break;
            case 5:
            case 9:
                this.payoutratio = 2 / 3;
                break;
            case 6:
            case 8:
                this.payoutratio = 5 / 6;
                break;
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
    
        if (number == 4 || number == 10) {
            this.payoutratio = 2 / 1;
        } else if (number == 5 || number == 9) {
            this.payoutratio = 3 / 2;
        } else if (number == 6 || number == 8) {
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
        let result = super.updateBet(table_object, dice_object);
        let status = result[0];
        let win_amount = result[1];
        if (!this.prepoint && this.subname == '') {
            this.subname = this.losing_numbers.join('');
            return [status, win_amount];
        }
        return [status, win_amount];
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
    constructor(betAmount, number) {
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
    constructor(betAmount, twodice) {
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
    constructor(numOfRuns=5000, maxRolls=200, maxShooters=20, bankroll=200, strategies=[passline]) {
        this.numOfRuns = numOfRuns;
        this.maxRolls = maxRolls;
        this.maxShooters = maxShooters;
        this.bankroll = bankroll;
        this.strategies = strategies;
    }

    printout() {
        let table = new Table();
        this.strategies.forEach(s=>{
            table.addPlayer(new Player(this.bankroll, s, s.name || s.constructor.name));
        })
        table.run(this.maxRolls, this.maxShooters);
    }

    run() {
        let output = {};
        for (let i = 0; i < this.numOfRuns; i++) {
            let table = new Table();
            this.strategies.forEach(s=>{
                table.addPlayer(new Player(this.bankroll, s, s.name || s.constructor.name));
            })
            table.run(this.maxRolls, this.maxShooters, false);
            table.players.forEach(player=>{
                // log(`${i},${player.name},${player.bankroll},${this.bankroll},${table.dice.numberOfRolls}`);
                output[player.name] = output[player.name] || [];
                output[player.name].push([i, player.bankroll, this.bankroll, table.dice.numberOfRolls]);
                })
        }
        return output;
    }
}

class Strategy {
    info = {};
    unit = 5;
    maxRolls = 0; // 0 for no limit
    maxShooters = 0; // 0 for no limit
    maxBankroll = 0; // 0 for no limit
    stopped = false;
    strategyBets = [];

    isStopped() {
        return this.stopped;
    }

    shouldStop(table, player) {
        if (player.bankroll < this.unit) {
            stopped = true;
        }
        if (this.maxBankRoll > 0 && player.bankroll > this.maxBankroll) {
            stopped = true;
        }
        if (table.numberOfRolls >= this.maxRolls) {
            stopped = true;
        }
        if (table.numberOfShooters >= this.maxShooters) {
            stopped = true;
        }
        return this.isStopped();
    }

    update(player, table, unit, strat_info) {
        if (this.isStopped()) {
            return;
        }
        this.strategyBets.forEach(b=>b.update(table, player));
    }

    addBet(strategyBet) {
        this.strategyBets.push(strategyBet);
    }

}

class passline extends Strategy {
    update(player, table, unit, strat_info) {
        if (!table.hasPoint() && !player.getBet("PassLine"))
        player.bet(new PassLine(unit));
    }
}

class passline_odds extends Strategy {
    constructor(win_mult=1) {
        super();
        this.win_mult = win_mult;
        this.passlineStrategy = new passline();
    }
    update(player, table, unit=5, strat_info=null) {
        this.passlineStrategy.update(player, table, unit);
        if (!table.hasPoint())
            return;
        let passlineBet = player.getBet("PassLine");
        if (!passlineBet)
            return;
        if (player.getBet("Odds", table.point))
            return;
        player.bet(new Odds(calculateOddsBet(table.point, unit=unit, this.win_mult), table.point));
    }
}

class passline_maxodds extends Strategy {
    passlineOddsStrategy = new passline_odds('345');
    update(player, table, unit=5, strat_info=null) {
        this.passlineOddsStrategy.update(player, table, unit, strat_info);
    }
}

class dontpass extends Strategy {
    update(player, table, unit=5, strat_info=null) {
        // Don't pass bet
        if (!table.hasPoint() && ! player.getBet("DontPass"))
            player.bet(new DontPass(unit));
    }
}

class dontpass_odds extends Strategy {
    constructor(win_mult=1) {
        super()
        this.win_mult = win_mult;
        this.dontpassStrategy = new dontpass();
    }
    update(player, table, unit=5, strat_info=null) {
        // Assume that someone tries to win the `win_mult` times the unit on each bet, which corresponds
        // well to the max_odds on a table.
        // For `win_mult` = "345", this assumes max of 3-4-5x odds
        this.dontpassStrategy.update(player, table, unit);

        if (table.hasPoint()) {
            let dontPassBet = player.getBet("DontPass");
            if (dontPassBet && !player.getBet("LayOdds", table.point)) {
                player.bet(new LayOdds(calculateLayOddsBet(table.point, unit, this.win_mult), table.point));
            }
        }
    }
}

class place5689 extends Strategy {
    update(player, table, unit=5, strat_info=null) {
        if (!table.hasPoint())
            return;

        [5, 6, 8, 9].forEach(n=>{
            if (player.getBet("Place", n))
                return;
            player.bet(new Place(calculatePlaceBet(n, unit), n));
        });
    }
}

class ironcross extends Strategy {
    passStrategy = new passline();
    passOddsStrategy = new passline_odds(2);

    update(player, table, unit=5, strat_info=null) {
        this.passStrategy.update(player, table, unit);
        this.passOddsStrategy.update(player, table, unit, strat_info=null);

        [5, 6, 8].forEach(n=>{
            if (player.getBet("Place", n))
                return;
            player.bet(new Place(calculatePlaceBet(n, unit * 2), n));
        });

        if (table.hasPoint() && !player.getBet("Field")) {
            player.bet(new Field(unit));
        }
    }
}

class hammerlock extends Strategy {
    passStrategy = new passline();
    dontPassStrategy = new dontpass_odds('345');


    update(player, table, unit=5, strat_info=null) {
        this.passStrategy.update(player, table, unit);
        this.dontPassStrategy.update(player, table, unit);

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
}

class buy_4_10 extends Strategy {
    update(player, table, unit=5, strat_info=null) {
        if (!table.hasPoint()) {
            return;
        }
        [4, 10].forEach(n=>{
            if (!player.getBet('Buy', n)) {
                player.bet(new Buy(unit, n));
            }
        });
    }
}

class hardways extends Strategy {
    update(player, table, unit=5, strat_info=null) {
        [4, 6, 8, 10].forEach(n=>{
            if (!player.getBet("Hard", n)) {
                player.bet(new Hard(unit, n));
            }        
        });
    }
}

class pass_dontpass_horn12 extends Strategy {
    passStrategy = new passline();
    dontStrategy = new dontpass();
    update(player, table, unit=5, strat_info=null) {
        this.passStrategy.update(player, table, unit);
        this.dontStrategy.update(player, table, unit);

        let mult = table.dice.total == 12 ? 10 : 1;
        player.bet(new Horn12(unit * mult));
    }
}

class pass_2come extends Strategy {
    passOddsStrategy = new passline_odds();
    update(player, table, unit=5, strat_info=null) {
        this.passOddsStrategy.update(player, table, unit);
        player.betsOnTable.filter(b=>b.name == "Come" && b.subname).forEach(b=>{
            if (!player.getBet("Odds", b.subname)) {
                player.bet(new Odds(unit, b.subname));
            }
        });
        if (table.hasPoint() && player.countBets("Come") < 2) {
            player.bet(new Come(unit));
        }
    }
}

class pass_dontpass extends Strategy {
    passStrategy = new passline();
    dontStrategy = new dontpass();
    update(player, table, unit=5, strat_info=null) {
        this.passStrategy.update(player, table, unit);
        this.dontStrategy.update(player, table, unit);
    }
}

class mike_harris extends Strategy {
    dontOddsStrategy = new dontpass_odds('345');
    update(player, table, unit=5, strat_info=null) {
        // dont pass bet with max odds laid
        this.dontOddsStrategy.update(player, table, unit=unit, strat_info)

        if (table.hasPoint()) {
            // Odds on any come bet that has established a point
            player.betsOnTable.filter(b=>b.name == "Come" && b.subname).forEach(b=>{
                if (!player.getBet("Odds", b.subname)) {
                    player.bet(new Odds(unit, b.subname));
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
                player.bet(new Hard(unit, table.point));
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
                player.bet(new Hop(hopAmount, "16"));
                player.bet(new Hop(hopAmount, "25"));
                player.bet(new Hop(hopAmount, "34"));
            }

            // Add a come bet every roll
            player.bet(new Come(unit));


        }
    }
}

class mike_harris_15 extends Strategy {
    dontOddsStrategy = new dontpass_odds('345');
    update(player, table, unit=5, strategyInfo=null) {
        if (strategyInfo && strategyInfo['stopped'])
            return strategyInfo;

        let startingMultipier = 1 + 0.6 * (.95 ** table.numberOfShooters);
        
        if (player.startingBankroll * startingMultipier < player.bankroll) {
            log("Strategy Mike Harris 15 stopping after " + table.numberOfShooters + " shooters because it hit:" + startingMultipier + " of starting bankroll");
            return {stopped: true};
        }
        unit = 15;
        // dont pass bet with max odds laid
        this.dontOddsStrategy.update(player, table, unit)

        if (table.hasPoint()) {
            // Remove any place bets that are now on the point
            let placePointBet = player.getBet("Place", table.point);
            if (placePointBet) {
                player.removeBetByObject(placePointBet);
            }
            // Remove any buy bets that are now on the point
            let buyPointBet = player.getBet("Buy", table.point);
            if (buyPointBet) {
                player.removeBetByObject(buyPointBet);
            }
            // Odds on any come bet that has established a point
            player.betsOnTable.filter(b=>b.name == "Come" && b.subname).forEach(b=>{
                if (!player.getBet("Odds", b.subname)) {
                    let oddsAmount = unit;
                    if (["4", "10"].indexOf(b.subname) > -1) {
                        oddsAmount = 45;
                    } else if (["6", "8"].indexOf(b.subname) > -1) {
                        oddsAmount = 35;
                    } else {
                        oddsAmount = 30;
                    }
                    player.bet(new Odds(oddsAmount, b.subname));
                }
            });
            // place inside numbers (unless odds exists on that number)
            [5, 9].forEach(n=>{
                if (table.point != n && !player.getBet("Odds", n) && !player.getBet("Place", n)) {
                    player.bet(new Place(20, n));
                }
            });
            [6, 8].forEach(n=>{
                if (table.point != n && !player.getBet("Odds", n) && !player.getBet("Place", n)) {
                    player.bet(new Place(24, n));
                }
            });
            [4, 10].forEach(n=>{
                if (table.point != n && !player.getBet("Odds", n) && !player.getBet("Buy", n)) {
                    player.bet(new Buy(21, n));
                }
            });
            // If point is hard way, bet that hard way
            if (table.point % 2 == 0 && !player.getBet("Hard", table.point)) {
                player.bet(new Hard(16, table.point));
            }

            // Count up the odds bets (which in this strategy are the Come bets)
            let oddsAtRisk = 0;
            player.betsOnTable.filter(b=>b.name == 'Odds').forEach(b=>oddsAtRisk += b.betAmount);
            let hopAmount = parseInt(oddsAtRisk/15) - 3;

            if (hopAmount > 0) {
                player.bet(new Hop(hopAmount, "16"));
                player.bet(new Hop(hopAmount, "25"));
                player.bet(new Hop(hopAmount, "34"));
            }

            // Add a come bet every roll
            player.bet(new Come(unit));


        }
    }
}

class frank_dontpassdontcome_odds_68 extends Strategy {
    dontStrategy = new dontpass();
    update(player, table, unit=5, strat_info=null) {
        this.dontStrategy.update(player, table, 50);

        if (table.hasPoint()) {
            if (!player.getBet("DontCome")) {
                player.bet(new DontCome(25));
            }
            if (player.getBet('DontPass') && !player.getBet("LayOdds", table.point) && [6,8].indexOf(table.point) > -1) {
                console.log("Laying odds for dontpass with losing numbers:" + player.getBet("DontPass").losing_numbers);
                player.bet(new LayOdds(100, table.point));
            }

            if (table.dice.total == 8) {
                console.log('here');
            }
            player.betsOnTable.filter(b=>b.name == "DontCome" && (b.subname == "6" || b.subname == "8")).forEach(b=>{
                if (!player.getBet("LayOdds", b.subname)) {
                    console.log("Laying odds for bet with losing numbers:" + b.losing_numbers);
                    player.bet(new LayOdds(50, b.subname));
                }
            });
    
        }
    }
}




// dice = new FakeDice([[5,5],[5,4],[5,3],[5,2]]);
// table = new Table(new Dice());
// table.addPlayer(new Player(500, mike_harris, 1));
// table.run(100, 20, verbose=true)

// let outputs = [];
// [mike_harris, pass_2come, pass_dontpass_horn12, hammerlock, dontpass_odds].forEach(strategy=>{
//     let sim = new Simulation(1000, 200, 20, 500, strategy);
//     //sim.printout();
//     outputs.push(sim.run());
// })
// console.log(outputs);

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
