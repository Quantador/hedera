import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Clé API (Client-ID) d'Imgur et Mistral
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const TCG_API_URL = 'https://api.pokemontcg.io/v2/cards'; // URL de l'API TCG Pokémon

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

// Fonction pour extraire le texte de l'image via l'API Mistral OCR
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
            // Afficher des informations supplémentaires de la carte
            console.log('Name:', card.name);
            console.log('Set:', card.set.name);
            console.log('Rarity:', card.rarity);
            console.log('Image URL:', card.images.large);
        } else {
            console.log('Aucune carte trouvée pour ce Pokémon.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de la carte :', error);
    }
}

// Exemple d'utilisation : télécharge une image depuis un chemin local et affiche le texte extrait
async function main() {
    const imagePath = 'test3.jpg'; // Remplace ce chemin par le chemin réel de l'image
    const imageUrl = await uploadImageToImgur(imagePath);

    if (imageUrl) {
        await extractTextFromImage(imageUrl);
    }
}

main();
