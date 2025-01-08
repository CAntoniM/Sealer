import { readFileSync, writeFileSync } from "fs";
import { exit } from "process";
import { Card, Cards, Sets } from "scryfall-api"

let argv = process.argv


interface PackDescriptor {
    set_id: string,
    count: number,
    type: string,
};

interface SlotDescriptor {
    rarities: string[],
    weights: number[],
    count: number
}

interface PackType {
    name: string,
    slots: SlotDescriptor[]
}

interface DraftDescriptor {
    packs: PackDescriptor[],
    types: PackType[]
}

function randomByWeight(values: string[], weights: number[]): string {
    let total = 0;

    // Sum total of weights
    weights.forEach(weight => {
        total += weight;
    })

    // Random a number between [1, total]
    const random = Math.ceil(Math.random() * total); // [1,total]

    // Seek cursor to find which area the random is in
    let cursor = 0;
    for (let i = 0; i < weights.length; i++) {
        cursor += weights[i];
        if (cursor >= random) {
            return values[i];
        }
    }
    exit(5);
}

function pull(pool: Card[]): Card {
    const random = Math.floor(Math.random() * pool.length);
    return pool[random];
}

function open_pack(pack: PackType, commmons: Card[], uncommons: Card[], rares: Card[], mythics: Card[]): Card[] {

    let cards: Card[] = [];

    for (let slot of pack.slots) {
        for (let i = 0; i < slot.count; i++) {
            switch (randomByWeight(slot.rarities, slot.weights)) {
                case 'common':
                    cards.push(pull(commmons));
                    break;
                case 'uncommon':
                    if (uncommons.length != 0) {
                        cards.push(pull(uncommons));
                    } else {
                        cards.push(pull(commmons));
                    }
                    break;
                case 'rare':
                    if (rares.length != 0) {
                        cards.push(pull(rares))
                    } else if (uncommons.length != 0) {
                        cards.push(pull(uncommons));
                    } else {
                        cards.push(pull(commmons));
                    }
                    break;
                case 'mythic':
                    if (mythics.length != 0) {
                        cards.push(pull(mythics));
                    } else if (rares.length != 0) {
                        cards.push(pull(rares));
                    } else if (uncommons.length != 0) {
                        cards.push(pull(uncommons));
                    } else {
                        cards.push(pull(commmons));
                    }
                    break;
            }
        }
    }
    return cards;
}

async function run_draft(draft: DraftDescriptor): Promise<Card[]> {

    let output: Card[] = [];

    for (let pack of draft.packs) {
        let cards = await Cards.search("is:booster e:" + pack.set_id).all();
        let commmons: Card[] = [];
        let uncommons: Card[] = [];
        let rares: Card[] = [];
        let mythics: Card[] = [];
        if (cards.length == 0){
            console.error( pack.set_id + " is not a valid set id");
            exit(20);
        }
        cards.forEach(card => {

            if (card.name) {
                switch (card.rarity) {
                    case 'common':
                        commmons.push(card);
                        break;

                    case 'mythic':
                        mythics.push(card);
                        break;

                    case 'rare':
                        rares.push(card)
                        break;

                    case 'uncommon':
                        uncommons.push(card);
                        break
                }
            }
        })

        let booster_type: PackType | undefined;

        draft.types.forEach(type => {
            if (type.name == pack.type) {
                booster_type = type;
            }
        })

        if (!booster_type) {
            console.error("Undefined booster type: " + pack.type);
            exit(2)
        }

        for (let i = 0; i < pack.count; i++) {
            output = output.concat(open_pack(booster_type, commmons, uncommons, rares, mythics));
        }
    };

    return output;
}

if (argv.length < 3) {
    console.error("No File given as input");
    exit(1)
}

let path = argv[2];

let file = readFileSync(path, 'utf-8');

const draft_descriptor: DraftDescriptor = JSON.parse(file);

let output = run_draft(draft_descriptor);


output.then(cards => {
    let count = 0;
    for(let card of cards) {
        console.log("1 " + card.name)
    }
})