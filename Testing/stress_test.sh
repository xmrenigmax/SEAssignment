#!/bin/bash

# Configuration
URL="http://localhost:5000/api/conversations"
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting Marcus Aurelius Stress Test...${NC}"

# 1. Create a Conversation to get an ID
echo -e "\n${CYAN}[Setup] Creating Conversation...${NC}"
RESPONSE=$(curl -s -X POST "$URL")
CONV_ID=$(echo $RESPONSE | jq -r '.id')

if [ "$CONV_ID" == "null" ]; then
    echo -e "${RED}❌ Failed to create conversation. Is server running?${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Conversation Created: $CONV_ID${NC}"

# Function to send a message and get just the text back
ask_marcus() {
    local msg="$1"
    # echo -e "   Sending: '$msg'..."
    curl -s -X POST "$URL/$CONV_ID/messages" \
         -H "Content-Type: application/json" \
         -d "{\"text\": \"$msg\"}" | jq -r '.marcusMessage.text'
}

# ==========================================================
# TEST 1: PROBABILITY DISTRIBUTION (100 Requests)
# ==========================================================
echo -e "\n${CYAN}📊 [TEST 1] Probability Check: Sending 'hello' 50 times...${NC}"
echo "---------------------------------------------------"

count_hail=0
count_greetings=0

for i in {1..50}
do
   # Send request
   RESULT=$(ask_marcus "hello")

   # Simple substring check to count responses
   if [[ "$RESULT" == *"Hail"* ]]; then
       ((count_hail++))
       echo -e "${GREEN}Run $i: Hail${NC}"
   elif [[ "$RESULT" == *"Greetings"* ]]; then
       ((count_greetings++))
       echo -e "${CYAN}Run $i: Greetings${NC}"
   elif [[ "$RESULT" == *"Ave"* ]]; then  # <--- ADD THIS BLOCK
       ((count_greetings++))               # Count it as a greeting
       echo -e "${CYAN}Run $i: Ave (Museum Script)${NC}"
   else
       echo -e "${RED}Run $i: UNKNOWN RESPONSE: $RESULT${NC}"
   fi
done

echo "---------------------------------------------------"
echo -e "📈 RESULTS:"
echo -e "   Hail: $count_hail (Expected ~20)"
echo -e "   Greetings: $count_greetings (Expected ~30)"

# ==========================================================
# TEST 2: NLP & FUZZY MATCHING
# ==========================================================
echo -e "\n${CYAN}🧠 [TEST 2] NLP Capabilities (Typos & Stemming)${NC}"
echo "---------------------------------------------------"

# List of tricky inputs
inputs=("helo" "greetings friend" "im walking" "i feel fear" "so anxious")

for input in "${inputs[@]}"
do
   echo -e "${CYAN}User:${NC} $input"
   ANSWER=$(ask_marcus "$input")
   echo -e "${GREEN}Marcus:${NC} $ANSWER\n"
done

# ==========================================================
# TEST 3: MODERATION FILTER
# ==========================================================
echo -e "\n${CYAN}🛡️  [TEST 3] Moderation & Safety${NC}"
echo "---------------------------------------------------"

bad_inputs=("you are a bad person" "swear words" "killing")

for input in "${bad_inputs[@]}"
do
   echo -e "${CYAN}User (Bad):${NC} $input"
   ANSWER=$(ask_marcus "$input")
   echo -e "${GREEN}Marcus:${NC} $ANSWER\n"
done

# ==========================================================
# TEST 4: VAGUE / AI FALLBACK
# ==========================================================
echo -e "\n${CYAN}🤖 [TEST 4] AI Fallback & Vague Questions${NC}"
echo "---------------------------------------------------"

ai_inputs=("what is it" "tell me about yourself" "how does a phone work")

for input in "${ai_inputs[@]}"
do
   echo -e "${CYAN}User:${NC} $input"
   ANSWER=$(ask_marcus "$input")
   echo -e "${GREEN}Marcus:${NC} $ANSWER\n"
done

echo -e "\n${CYAN}✅ Stress Test Complete.${NC}"