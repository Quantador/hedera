import fetch from "node-fetch";
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';
import { AccountId, PrivateKey, Client, TokenCreateTransaction, TokenType, TokenSupplyType, Hbar, TokenMintTransaction } from '@hashgraph/sdk'; // v2.46.0

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Clé API (Client-ID) d'Imgur et Mistral
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const TCG_API_URL = 'https://api.pokemontcg.io/v2/cards'; // URL de l'API TCG Pokémon
const JWT = process.env.PINATA_JWT;

// Fonction pour télécharger une image sur Imgur
async function uploadImageToImgur(imagePath) {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath)); // Lire l'image depuis le fichier local

    try {
        const response = await axios.post('https://api.imgur.com/3/upload', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
            },
        });

        // Vérifier si l'upload a réussi et afficher l'URL de l'image
        if (response.data.success) {
            console.log('Image téléchargée avec succès !');
            const link = response.data.data.link;
            console.log('URL de l\'image :', link);
            return link; // Retourne l'URL de l'image téléchargée
        } else {
            console.error('Erreur lors du téléchargement de l\'image:', response.data.data.error);
            return null;
        }
    } catch (error) {
        console.error('Erreur de requête :', error);
        return null;
    }
}

// Fonction pour extraire le texte de l'image via l'API Mistral Vision
async function extractTextFromImage(imageUrl) {
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });

    try {
        const prompt = `
            The image you're analyzing contains a Pokémon card. Please extract the following information:
            1. The Pokémon's name (e.g., "Yungoos").
            2. The Pokémon's number, which is located in the bottom-left corner of the card in the format "XXX/YYY" (e.g., "117/159"). Extract only the "XXX" part of the number (e.g., "117").

            Return this information in a structured JSON format. Example:
            {
              "name": "Yungoos",
              "number": "117"
            }
        `;

        const chatResponse = await client.chat.complete({
            model: "pixtral-12b",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    imageUrl: imageUrl,
                  },
                ],
              },
            ],
        });

        // Déclarer la variable 'responseText' avant de l'utiliser
        let responseText = chatResponse.choices[0].message.content;

        // Nettoyer la réponse (enlever les backticks et le mot "json")
        responseText = responseText.replace(/`/g, '').replace(/^json\s*\n*/, '').trim();
        console.log('Texte extrait de l\'image :', responseText);

        // Vérifier si la réponse est un JSON valide
        try {
            const extractedData = JSON.parse(responseText);

            // Stockage du nom et du numéro du Pokémon dans des variables
            const pokemonName = extractedData.name;
            const pokemonNumber = extractedData.number;

            // Affichage des résultats
            console.log('Pokémon Name:', pokemonName);
            console.log('Pokémon Number:', pokemonNumber);

            // Appeler l'API TCG pour récupérer plus d'informations sur la carte
            await fetchPokemonCardInfo(pokemonName, pokemonNumber);

        } catch (jsonError) {
            console.error('Erreur de parsing JSON :', jsonError);
        }

    } catch (error) {
        console.error("Erreur lors de l'appel à l'API Mistral Vision : ", error);
    }
}

// Fonction pour récupérer les informations de la carte Pokémon via l'API TCG
async function fetchPokemonCardInfo(pokemonName, pokemonNumber) {
    try {
        const response = await axios.get(TCG_API_URL, {
            params: {
                q: `name:${pokemonName} number:${pokemonNumber}`, // Filtrage par nom et numéro de carte
            },
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.data.data.length > 0) {
            // Récupérer la première carte correspondant à la recherche
            const card = response.data.data[0];

            console.log('Card Information:', card);

            // Ici on récupère l'URL de l'image de la carte Pokémon
            const cardImageUrl = card.images.large;

            // Créer un NFT avec les informations récupérées
            await createNFT(card);

        } else {
            console.log('Aucune carte trouvée pour ce Pokémon.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de la carte :', error);
    }
}

async function uploadMetadataToIPFS(jsonData) {

    console.log(jsonData)
    try {
        const filePath = "metadata.json";

        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

        const formData = new FormData();

        // Ajouter le fichier JSON au FormData
        formData.append("file", fs.createReadStream(filePath));

        // Ajouter les métadonnées réseau
        formData.append("network", "public");

        const request = await fetch("https://uploads.pinata.cloud/v3/files", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${JWT}`,
        },
        body: formData,
        });

        const response = await request.json();

        // Suppression du fichier JSON temporaire après l'upload
        fs.unlinkSync(filePath);

        if (response && response.data && response.data.cid) {
            const cid = response.data.cid
            console.log("IPFS CID:", cid);
            // Retourner le cid
            return cid;
        } else {
            console.error("Erreur dans la réponse de l'API", response);
            return null;
        }

    } catch (error) {
        console.error("Upload failed:", error);
    }
}

// Fonction pour créer le NFT
async function createNFT(pokemonJson) {
    let client;
    try {
        // Your account ID and private key from string value
        const MY_ACCOUNT_ID = AccountId.fromString(process.env.ACCOUNT_ID);
        const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(process.env.PRIVATE_KEY);

        // Pre-configured client for test network (testnet)
        client = Client.forTestnet();

        // Set the operator with the account ID and private key
        client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

        // Préparer les métadonnées pour le NFT
        const metadata = {
            "name": pokemonJson.name,
            "description": "A unique Pokémon NFT",
            "image": pokemonJson.images.large,
            "properties": pokemonJson
        };

        console.log(metadata)

        // Télécharger les métadonnées sur IPFS
        const ipfsHash = await uploadMetadataToIPFS(metadata);
        const CID_link = `ipfs://${ipfsHash}`;

        const CID = [
          Buffer.from(
            CID_link
          )
        ];

        console.log("IPFS CID link:", CID_link);

        const setName = pokemonJson.set.name;
        const setSymbol = pokemonJson.set.ptcgoCode;

        // Start the NFT creation process
        const nftCreateTransaction = new TokenCreateTransaction()
            .setTokenName(setName)
            .setTokenSymbol(setSymbol)
            .setTokenType(TokenType.NonFungibleUnique)
            .setDecimals(0)
            .setInitialSupply(0)
            .setSupplyKey(MY_PRIVATE_KEY)
            .setTreasuryAccountId(MY_ACCOUNT_ID)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(250)
            .freezeWith(client);

        const nftCreateTxSign = await nftCreateTransaction.signWithOperator(client);
        const nftCreateSubmit = await nftCreateTxSign.execute(client);
        const nftCreateRx = await nftCreateSubmit.getReceipt(client);
        console.log("Token ID: " + nftCreateRx.tokenId.toString());

        const maxTransactionFee = new Hbar(20);
        
        // Créer un NFT avec l'IPFS hash des métadonnées
        const nftMintTransaction = new TokenMintTransaction()
            .setTokenId(nftCreateRx.tokenId)
            .setMetadata(CID) // Utilise l'IPFS hash pour les métadonnées
            .setMaxTransactionFee(maxTransactionFee)
            .freezeWith(client);

        const nftMintTxSign = await nftMintTransaction.signWithOperator(client);
        const nftMintSubmit = await nftMintTxSign.execute(client);
        const nftMintRx = await nftMintSubmit.getReceipt(client);

        console.log("NFT Minted: " + nftMintRx.serials.toString());

    } catch (error) {
        console.error(error);
    } finally {
        if (client) client.close();
    }
}

async function main() {
    const imagePath = 'test2.jpg'; // Remplace ce chemin par le chemin réel de l'image
    const imageUrl = await uploadImageToImgur(imagePath);

    if (imageUrl) {
        await extractTextFromImage(imageUrl);
    }
}

main();
