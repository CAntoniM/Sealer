import { Sets, Set } from "scryfall-api";

interface PackDescriptor {
    set_id: string,
    count: number,
    type: string,
};

Sets.all().then(sets => {
    let tmp: Set[] = [];

    sets.forEach(set => {
        if (set.set_type == 'core' || set.set_type == 'expansion') {
            tmp.push(set);
        }
    })

    let packs: PackDescriptor[] = []

    for (let i = 0; i < 64; i++) {
        let pick = Math.floor(Math.random() * tmp.length) - 2;
        pick ++;
        packs.push({ set_id: tmp[pick].code, count: 1, type: "booster" })
    }

    console.log(JSON.stringify(packs));
});
