source ./.env

API_URL="https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_SITE_URL="http://localhost:3000"
OPENROUTER_SITE_NAME="Exemplo9 - OpenRouter"
NLP_MODEL="inclusionai/ling-3.0-flash-sante:free"

curl --silent -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" \
    -H "HTTP-Referer: $OPENROUTER_SITE_URL"\
    -H "X-Title: $OPENROUTER_SITE_NAME" \
    -d '{ 
        "model": '"'$NLP_MODEL'"',
        "messages":[ 
            {
                "role":"user",
                "content":"Qual a maior cidade do mundo em área territorial?"
            }
        ],
        "temperature": 0.3,
        "max_tokens": 1000
    }'
