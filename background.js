// background.js
console.log("YouTube Summary: Background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Summary: Extension installed");
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("YouTube Summary: Message received in background:", request);

  if (request.action === "generateSummary") {
    generateAISummary(request)
      .then((summary) => {
        sendResponse({ summary });
      })
      .catch((error) => {
        console.error("YouTube Summary: Error generating summary:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  return true;
});

// Generate AI summary using OpenAI API
async function generateAISummary({ transcript, title, channel, url }) {
  try {
    // Get API key from storage
    const result = await chrome.storage.sync.get([
      "openaiApiKey",
      "customPrompt",
    ]);
    const apiKey = result.openaiApiKey;

    if (!apiKey) {
      throw new Error(
        "OpenAI API key not configured. Please set it in the extension options.",
      );
    }

    // Default prompt if none provided
    const customPrompt = `
Résumé EXHAUSTIF en français • Termes techniques → anglais • Vidéo ~1h+ = analyse proportionnelle

STYLE REQUIS:
* Nettoyer les formulations peu importantes pour polir le style et le rendre plus incisif
* Utiliser des symboles pour raccourcir les idées (*, →, ≠, ~, +, etc.)

DÉTECTION AUTO DU TYPE:
* TALK/CONFÉRENCE → focus sur thèse centrale + arguments + implications pratiques
* REVIEW/ANALYSE → focus sur méthodologie + évaluation + comparaisons + recommandations

## 0. Résumé brutal
→ Une phrase directe qui capture l'essence du contenu

## 1. Sujet Principal
[TALK] * Thèse/message central défendu + pourquoi maintenant
[REVIEW] * Sujet analysé + méthodologie/angle d'évaluation utilisé
* Contexte & problématique abordée
* Positionnement dans son domaine

## 1.5. Hiérarchie d'Importance
🔥 CRITIQUE (20% → 80% valeur):
* Les 2-3 insights qui changent vraiment la donne
* Points que l'auteur répète/emphasise le plus

⚡ IMPORTANT (30% du contenu):
* Arguments solides qui supportent le message principal
* Exemples concrets avec impact mesurable

📋 SECONDAIRE (50% restant):
* Contexte utile mais pas essentiel
* Détails techniques ou anecdotes illustratives

## 2. Points Clés (8-12) - AVEC DISTINCTION
Pour chaque point, préciser:
* 📊 FAIT: [Données/citations directes de la transcription]
* 💭 OPINION: [Positions/jugements exprimés par l'auteur]
* 🧠 INTERPRÉTATION: [Analyses ajoutées par l'IA, pas dans l'original]

Format: Point → 📊 Fait + 💭 Opinion + 🧠 Implication

## 3. Insights & Leçons - AVEC SOURCES
* 4-5 insights substantiels avec:
  - 📊 Base factuelle (citations directes)
  - 💭 Position de l'auteur
  - 🧠 Applications pratiques déduites
  - Niveau de confiance: ★★★ (certain) → ★ (inféré)

## 4. Citations Marquantes
* 📊 Citations FACTUELLES: [Affirmations vérifiables]
* 💭 Citations OPINIONNELLES: [Jugements/positions personnelles]
* ⚠️ Affirmations à vérifier: [Claims qui demandent validation externe]

## 5. À Retenir (par thème + type)
* 📊 FAITS établis: Points vérifiables
* 💭 POSITIONS défendues: Arguments de l'auteur
* 🧠 IMPLICATIONS: Conséquences logiques

## 6. Actions Recommandées
* 🔥 IMMÉDIAT (impact élevé, effort faible): Action → résultat dans X jours
* ⚡ COURT TERME (préparation requise): Action → prérequis → ROI
* 📈 LONG TERME (investissement important): Vision → étapes → indicateurs

## 7. Conclusion + Validation
* Synthèse: éléments majeurs + implications + prochaines étapes
* ⚠️ Points manquant de support dans la transcription originale
* 🎯 Niveau de confiance global: ★★★ → ★

---
VALIDATION FINALE:
* Marquer clairement transcription vs interprétation IA
* Signaler affirmations non-supportées
* Séparer FAITS vs OPINIONS vs INTERPRÉTATIONS
* Indiquer niveau de confiance pour chaque insight majeur
    `.trim();

    const prompt = `
${customPrompt}

Video Title: ${title}
Channel: ${channel || "Unknown"}

Transcript:
${transcript}
    `.trim();

    console.log("YouTube Summary: Making OpenAI API request");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // More cost-effective model
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`,
      );
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("No summary generated by OpenAI API");
    }

    console.log("YouTube Summary: Summary generated successfully");
    return summary;
  } catch (error) {
    console.error("YouTube Summary: Error in generateAISummary:", error);
    throw error;
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes("youtube.com/watch")) {
    chrome.tabs.sendMessage(tab.id, { action: "triggerSummary" });
  } else {
    console.log("YouTube Summary: Not on a YouTube video page");
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "trigger-summary") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url.includes("youtube.com/watch")) {
        chrome.tabs.sendMessage(tab.id, { action: "triggerSummary" });
      } else {
        console.log("YouTube Summary: Not on a YouTube video page");
      }
    });
  }
});
