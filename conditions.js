class Condition {
    isTrue(player, table) {
        return true;
    }
}

class ConditionCompare extends Condition {
    constructor(value1, value2) {
        super();
        this.value1 = value1;
        this.value2 = value2;
    }
}

class ConditionWrapper extends Condition {
    constructor(conditions) {
        super();
        this.conditions = conditions;
    }
}

class ConditionEquals extends ConditionCompare {
    isTrue(player, table) {
        return this.value1.get(player, table) == this.value2.get(player, table);
    }
}

class ConditionNotEquals extends ConditionCompare {
    isTrue(player, table) {
        return this.value1.get(player, table) != this.value2.get(player, table);
    }
}

class ConditionMoreThan extends ConditionCompare {
    isTrue(player, table) {
        return this.value1.get(player, table) > this.value2.get(player, table);
    }
}

class ConditionLessThan extends ConditionCompare {
    isTrue(player, table) {
        return this.value1.get(player, table) < this.value2.get(player, table);
    }
}

class ConditionAnd extends ConditionWrapper {
    isTrue(player, table) {
        for (let i = 0; i < this.conditions.length; i++) {
            if (!this.conditions[i].isTrue(player, table))
                return false;
        }
        return true;
    }
}

class ConditionOr extends ConditionWrapper {
    isTrue(player, table) {
        for (let i = 0; i < this.conditions.length; i++) {
            if (this.isTrue(this.conditions[i]))
                return true;
        }
        return false;
    }
}

class Value {}

class ValueExact extends Value {
    constructor(number) {
        this.number = number;
    }
    get(player, table) {
        return this.number;
    }
}

class ValuePoint extends Value {
    get(player, table) {
        return table.point || 0;
    }
}

class ValueShooterPoints extends Value{
    get(player, table) {
        return player.shooterPoints;
    }
}

class ValueShooterNaturals extends Value {
    get(player, table) {
        return player.shooterNaturals;
    }
}

class ValueNumberOfShooters extends Value {
    get(player, table) {
        return player.numberOfShooters;
    }
}

class ValueLastRoll extends Value {
    get(player, table) {
        return player.lastRoll;
    }
}

class ValueBankroll extends Value {
    get(player, table) {
        return player.bankroll;
    }
}

class ValueBetsOnTable extends Value {
    get(player, table) {
        return player.totalBetAmount;
    }
}