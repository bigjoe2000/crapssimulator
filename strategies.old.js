// These are no longer used by the rest of the code. They are now defined in a database

class passline extends Strategy {
    static description() {return 'Bet 5 on the Pass'};
    update(player, table, unit) {
        if (!table.hasPoint() && !player.getBet("Pass"))
        player.bet(new Pass(unit));
    }
}

class passline_odds extends Strategy {
    static description() {return 'Bet 5 on the Pass + 1x odds'};
    update(player, table, unit=5) {
        let passlineBet = player.getBet("Pass");
        if (!table.hasPoint() && !passlineBet) {
            player.bet(new Pass(unit));
        } else if (table.hasPoint()) {
            let oddsBet = player.getBet("Odds", table.point);
            if (!oddsBet) {
                player.bet(new Odds(calculateOddsBet(table.point, unit=unit, 1), table.point));            }
        }
    }
}

class passline_maxodds extends Strategy {
    static description() {return 'Bet 5 on the Pass + 345x odds'};
    update(player, table, unit=5) {
        let passlineBet = player.getBet("Pass");
        if (!table.hasPoint() && !passlineBet) {
            player.bet(new Pass(unit));
        } else if (table.hasPoint()) {
            let oddsBet = player.getBet("Odds", table.point);
            if (!oddsBet) {
                player.bet(new Odds(calculateOddsBet(table.point, unit=unit, '345'), table.point));            
            }
        }
    }
}

class dontpass extends Strategy {
    static description() {return 'Bet 5 on the DontPass'};
    update(player, table, unit=5) {
        // Don't pass bet
        if (!table.hasPoint() && ! player.getBet("DontPass"))
            player.bet(new DontPass(unit));
    }
}

class dontpass_odds extends Strategy {
    static description() {return 'Bet 5 on the DontPass with $30 odds'};
    update(player, table, unit=5) {
        let dontPassBet = player.getBet("DontPass");
        if (!table.hasPoint() && !dontPassBet)
            player.bet(new DontPass(unit));
        else if (table.hasPoint()) {
            if (dontPassBet && !player.getBet("LayOdds", table.point)) {
                player.bet(new LayOdds(30, table.point));
            }
        }
    }
}

class place5689 extends Strategy {
    static description() {return 'Place the 5/6/8/9 for $5 each'};
    update(player, table, unit=5) {
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
    static description() {return 'Pass with 2x odds, place 5,6,8 and bet the field'};

    update(player, table, unit=5) {
        let passlineBet = player.getBet("Pass");
        if (!table.hasPoint() && !passlineBet) {
            player.bet(new Pass(unit));
        } else if (table.hasPoint()) {
            let oddsBet = player.getBet("Odds", table.point);
            if (!oddsBet) {
                player.bet(new Odds(calculateOddsBet(table.point, unit=unit, 2), table.point));            }
        }

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
    static description() {return 'Pass with no odds, Dontpass with 345x odds, mess around with place bets'};
    update(player, table, unit=5) {
        if (!table.hasPoint() && !player.getBet("Pass"))
            player.bet(new Pass(unit));
            let dontPassBet = player.getBet("DontPass");
        if (!table.hasPoint() && !dontPassBet)
            player.bet(new DontPass(unit));
        else if (table.hasPoint()) {
            if (dontPassBet && !player.getBet("LayOdds", table.point)) {
                player.bet(new LayOdds(30, table.point));
            }
        }

        if (!player.strategyInfo || !table.hasPoint()) {
            player.strategyInfo.mode = "place68";
            player.remove("Place");
        }

        let placesCount = player.countBets("Place");
        if (player.strategyInfo.mode == "place68") {
            // We have place bets up, but not all, so one of them won
            if (table.hasPoint() && placesCount > 0 && placesCount < 2) {
                player.remove("Place");
                player.strategyInfo.mode = "place_inside";
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
        } else if (player.strategyInfo.mode == "place_inside") {
            if (table.hasPoint() && placesCount > 0 && placesCount < 4) {
                // one of our place bets won. Take them all down
                player.remove("Place");
                player.strategyInfo.mode = "takedown";
            } else {
                [5, 6, 8, 9].forEach(n=>{
                    if (player.getBet("Place", n)) {
                        return;
                    }
                    player.bet(new Place(calculatePlaceBet(n, unit * 2), n));
                });
            }
        } else if (player.strategyInfo.mode == "takedown" && !table.hasPoint()) {
            player.strategyInfo.stopped = true;
        }
    }
}

class buy_4_10 extends Strategy {
    static description() {return 'Buy the 4 and 10'};
    update(player, table, unit=5) {
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
    static description() {return 'Bet all the hard ways'};
    update(player, table, unit=5) {
        [4, 6, 8, 10].forEach(n=>{
            if (!player.getBet("Hard", n)) {
                player.bet(new Hard(unit, n));
            }        
        });
    }
}

class pass_dontpass_horn12 extends Strategy {
    static description() {return 'Pass and DontPass. Bet the Horn12 every roll. If it wins, bet 10x'};
    update(player, table, unit=5) {
        if (!table.hasPoint() && !player.getBet("Pass"))
            player.bet(new Pass(unit));
        if (!table.hasPoint() && !player.getBet("DontPass"))
            player.bet(new DontPass(unit));

        let mult = table.dice.total == 12 ? 10 : 1;
        player.bet(new Horn12(unit * mult));
    }
}

class pass_2come extends Strategy {
    static description() {return 'Pass with 1x odds Place 2 come bets with 1x odds'};
    update(player, table, unit=5) {
        let passlineBet = player.getBet("Pass");
        if (!table.hasPoint() && !passlineBet) {
            player.bet(new Pass(unit));
        } else if (table.hasPoint()) {
            let oddsBet = player.getBet("Odds", table.point);
            if (!oddsBet) {
                player.bet(new Odds(calculateOddsBet(table.point, unit=unit, '345'), table.point));            }
        }

        player.betsOnTable.filter(b=>b.name == "Come" && b.subname).forEach(b=>{
            if (!player.getBet("Odds", b.subname)) {
                player.bet(new Odds(calculateOddsBet(b.subname, unit=unit, '345'), b.subname));
            }
        });
        if (table.hasPoint() && player.countBets("Come") < 2) {
            player.bet(new Come(unit));
        }
    }
}

class mike_harris extends Strategy {
    static description() {return '$15 DontPass with 345x lay. $15 Come when point is on. Place 5/6/8/9 for $20/$24. Buy the 4/10 for $20(+1). Use place/buy bet winnings to cover come bet odds. Press come odds by $10 with every off/on. Bet $16 point Hardway, $3 on rest. Hop the 7 once enough come bets are working. Stop when new shooter comes out and bankroll is <$250 or > a degrading % of starting bankroll. Also stop if maxRolls or maxShooters is reached. On Come out roll, if bases loaded, hop the 7 for $16 each, hop 12/56 for $4, 11/66 for $2.'};

    update(player, table, unit=5) {
        unit = 15;

        if (player.strategyInfo.stopped)
            return;

        let startingMultipier = 1 + 0.6 * (0.95 ** table.numberOfShooters);
        
        if (player.startingBankroll * startingMultipier < player.bankroll && table.shooterRolls == 0) {
            log("Strategy stopping after " + table.numberOfShooters + " shooters because it hit:" + (startingMultipier*100).toFixed(1) + "% of starting bankroll");
            player.strategyInfo.stopped = true;
            return;
        }

        if (player.bankroll < 250 && table.shooterRolls == 0) {
            log("Strategy stopping with new shooter because bankroll is too low");
            player.strategyInfo.stopped = true;
            return;
        }

        let dontPassBet = player.getBet("DontPass");
        if (!table.hasPoint() && !dontPassBet)
            player.bet(new DontPass(unit));
        else if (table.hasPoint()) {
            if (dontPassBet && !player.getBet("LayOdds", table.point)) {
                player.bet(new LayOdds(90, table.point));
            }
        }
    
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

                        // Press the odds $10 for every time we've won
                        oddsAmount = Math.min(75, 35 + (player.strategyInfo.currentShooter.betsWon.filter(bw=>bw.name=='Odds' && bw.subname==b.subname).length * 10));
                    } else {
                        oddsAmount = Math.min(60, 30 + (player.strategyInfo.currentShooter.betsWon.filter(bw=>bw.name=='Odds' && bw.subname==b.subname).length * 10));
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
            
            // bet 3 on rest (or all) of the hardways
            [4,6,8,10].forEach(n=>{
                if (!player.getBet("Hard", n)) {
                    player.bet(new Hard(3, n));
                }
            })

            let oddsAtRisk = 0;
            player.betsOnTable.filter(b=>b.name == 'Odds' || b.name == 'Buy').forEach(b=>{
                if (b.name == 'Buy') oddsAtRisk += b.betAmount;
                b.offOnComeOut = true;
            });

            let hopAmount = parseInt(oddsAtRisk/15) - 3;

            if (hopAmount > 0) {
                player.bet(new Hop(hopAmount, "16"));
                player.bet(new Hop(hopAmount, "25"));
                player.bet(new Hop(hopAmount, "34"));
            }

            // Add a come bet every roll
            player.bet(new Come(unit));
        } else {
             // Odds on any come bet that has established a point
             player.betsOnTable.filter(b=>b.name == "Come" && b.subname).forEach(b=>{
                if (!player.getBet("Odds", b.subname)) {
                    let oddsAmount = unit;
                    if (["4", "10"].indexOf(b.subname) > -1) {
                        oddsAmount = 45;
                    } else if (["6", "8"].indexOf(b.subname) > -1) {

                        // Press the odds $10 for every time we've won
                        oddsAmount = Math.min(75, 35 + (player.strategyInfo.currentShooter.betsWon.filter(bw=>bw.name=='Odds' && bw.subname==b.subname).length * 10));
                    } else {
                        oddsAmount = Math.min(60, 30 + (player.strategyInfo.currentShooter.betsWon.filter(bw=>bw.name=='Odds' && bw.subname==b.subname).length * 10));
                    }
                    player.bet(new Odds(oddsAmount, b.subname));
                }
            });
            // Count up the odds bets (which in this strategy are the Come bets)
            let numbersCovered = player.betsOnTable.filter(b=>b.name == 'Odds' || b.name == 'Buy').length;
            
            if (numbersCovered > 5) {
                // Enough numbers are covered, let's go for a $48 hop of 7 and $12 on horns
                player.bet(new Hop(16, "16"));
                player.bet(new Hop(16, "25"));
                player.bet(new Hop(16, "34"));
                player.bet(new Hop(4, "12"));
                player.bet(new Hop(4, "56"));
                player.bet(new Hop(2, "11"));
                player.bet(new Hop(2, "66"));
                player.betsOnTable.filter(b=>b.name == 'Odds' || b.name == 'Buy').forEach(b=>b.offOnComeOut = false);
            }
        }
    }
}

class frank_dontpassdontcome_odds_68 extends Strategy {
    static description() {return '$50 on DontPass. $25 DontCome. Lay $100 in odds if point is 6/8. Lay $50 DontComeOdds on 6/8'};
    update(player, table, unit=5) {
        let dontPassBet = player.getBet("DontPass");
        if (!table.hasPoint() && !dontPassBet)
            player.bet(new DontPass(50));

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

class mikeharrisno59 extends Strategy {
    static description() {return '$25 DontPass with 345x lay. $15 Come when point is on. Place 6/8 for $24. Buy the 4/10 for $25(+1). Use place/buy bet winnings to cover come bet odds. Press come odds by $10 with every off/on. Bet $4 point Hardway, $2 on rest. Hop the 7 for $8, horns for $2/$4 when bases loaded. Stop when new shooter comes out and bankroll is <$250 or > a degrading % of starting bankroll. Also stop if maxRolls or maxShooters is reached.'};
    update(player, table, unit=5) {

if (player.strategyInfo.stopped)
    return;

let startingMultipier = 1 + 0.6 * (0.95 ** table.numberOfShooters);

if (player.startingBankroll * startingMultipier < player.bankroll && table.shooterRolls == 0) {
    log("Strategy stopping after " + table.numberOfShooters + " shooters because it hit:" + (startingMultipier*100).toFixed(1) + "% of starting bankroll");
    player.strategyInfo.stopped = true;
    return;
}

if (player.bankroll < 250 && table.shooterRolls == 0) {
    log("Strategy stopping with new shooter because bankroll is too low");
    player.strategyInfo.stopped = true;
    return;
}

unit = 15;

if (!table.hasPoint() && !player.getBet("DontPass")) {
    player.bet(new DontPass(25));
}

if (table.hasPoint()) {
    
    player.removeBetByObject(player.getBet("LayOdds", table.point));
    let numberOfComeBets = Math.floor(player.betsOnTable.filter(b=>b.name == 'Odds').length / 2);
    player.bet(new LayOdds(90 + numberOfComeBets * 30, table.point));
    
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

                // Press the odds $10 for every time we've won
                oddsAmount = Math.min(75, 35 + (player.strategyInfo.currentShooter.betsWon.filter(bw=>bw.name=='Odds' && bw.subname==b.subname).length * 10));
            } else {
                oddsAmount = Math.min(60, 30 + (player.strategyInfo.currentShooter.betsWon.filter(bw=>bw.name=='Odds' && bw.subname==b.subname).length * 10));
            }
            player.bet(new Odds(oddsAmount, b.subname));
        }
    });

    [6, 8].forEach(n=>{
        if (table.point != n && !player.getBet("Odds", n) && !player.getBet("Place", n)) {
            player.bet(new Place(24, n));
        }
    });
    [4, 10].forEach(n=>{
        if (table.point != n && !player.getBet("Odds", n) && !player.getBet("Buy", n)) {
            player.bet(new Buy(26, n));
        }
    });
    // If point is hard way, bet that hard way
    if (table.point % 2 == 0 && !player.getBet("Hard", table.point)) {
        player.bet(new Hard(4, table.point));
    }
    
    // bet 3 on rest (or all) of the hardways
    [4,6,8,10].forEach(n=>{
        if (!player.getBet("Hard", n)) {
            player.bet(new Hard(2, n));
        }
    })

    let oddsAtRisk = 0;
    player.betsOnTable.filter(b=>b.name == 'Odds' || b.name == 'Buy').forEach(b=>{
        if (b.name == 'Buy') oddsAtRisk += b.betAmount;
        b.offOnComeOut = true;
    });

    if (player.betsOnTable.filter(b=>b.name == 'Odds').length > 4) {
        player.bet(new Hop(8, "16"));
        player.bet(new Hop(8, "25"));
        player.bet(new Hop(8, "34"));
        player.bet(new Hop(2, "56"));
        player.bet(new Hop(2, "12"));
        player.bet(new Hop(1, "66"));
        player.bet(new Hop(1, "11"));
    }

    // Add a come bet every roll
    player.bet(new Come(unit));

        }
    }
}