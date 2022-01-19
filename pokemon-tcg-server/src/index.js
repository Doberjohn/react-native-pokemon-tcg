//@author John Fanidis

const express = require('express');
const bodyParser = require("body-parser");
const pokemon = require('pokemontcgsdk');
pokemon.configure({apiKey: '430d6656-632d-40bb-a8ad-09ff74c18871'});

const tradeTypes = require('./tradeTypes');

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send('Pokemon TCG server');
});

app.post("/getCards", async (req, res) => {
    const query = req.body.query;
    if (!query) {
        return res.status(422).send({error: "You must provide a search query"});
    }

    try {
        const cards = await pokemon.card.where({ q: query });
        return res.send(cards);
    } catch (e) {
        return res.status(422).send({error: "No matching cards were found"});
    }
});

app.post("/getSets", async (req, res) => {
    const query = req.body.query;
    if (!query) {
        return res.status(422).send({error: "You must provide a search query"});
    }

    try {
        const set = await pokemon.set.where({ q: query });
        return res.send(set);
    } catch (e) {
        return res.status(422).send({error: "No matching sets were found"});
    }
});

app.post("/openPack", async (req, res) => {
    const setId = req.body.setId;
    if (!setId) {
        return res.status(422).send({error: "You must provide set id"});
    }

    let numberOfCommons;
    let numberOfUncommons;
    let numberOfRares;
    let rareHoloProbability;

    switch (setId) {
        case 'base1':
            numberOfCommons = 7;
            numberOfUncommons = 3;
            numberOfRares = 1;
            rareHoloProbability = 20; //percent
            break;
        default:
            break;
    }

    try {
        const cards = await pokemon.card.where({q: `set.id:${setId}`});
        const isRareHolo = rareHoloProbability >= Math.floor(Math.random() * 100) + 1;

        const commons = getXCards(cards, numberOfCommons, 'Common').map(card=>card.images);
        const uncommons = getXCards(cards, numberOfUncommons, 'Uncommon').map(card=>card.images);
        const rares = getXCards(cards, numberOfRares, isRareHolo ? 'Rare Holo' : 'Rare').map(card=> {
            return {
                images: card.images,
                rarity: card.rarity
            }
        });

        return res.send({message: 'Pack was successfully generated', commons, uncommons, rares});
    } catch (e) {
        return res.status(422).send({error: "No matching sets were found"});
    }
});

app.post('/createTrade', async(req,res)=> {
    const setId = req.body.setId;
    if (!setId) {
        return res.status(422).send({error: "You must provide set id"});
    }

    try {
        const cards = await pokemon.card.where({q: `set.id:${setId}`});
        const randomIndex = Math.floor(Math.random() * 16);
        const tradeType = tradeTypes[randomIndex];
        const numberOfGives = tradeType.gives.quantity;
        const numberOfWants = tradeType.wants.quantity;

        let gives = getXCards(cards, numberOfGives, tradeType.gives.rarity);
        let wants = getXCards(cards, numberOfWants, tradeType.wants.rarity);

        return res.send({"message": "Trade was successfully created", tradeType, gives, wants});
    } catch (e) {
        return res.status(422).send({error: "No matching sets were found"});
    }
});

const getXCards = (cardPool, numberOfCards, rarity)=> {
    let cards = [];

    const filteredCardPool = cardPool.data.filter(card=>card.rarity===rarity);
    for (let i=0; i<numberOfCards; i++) {
        cards = [...cards, filteredCardPool[Math.floor(Math.random() * filteredCardPool.length)]];
    }

    return cards;
}

app.listen(4567, () => {
    console.log("Listening on port 4567");
});
