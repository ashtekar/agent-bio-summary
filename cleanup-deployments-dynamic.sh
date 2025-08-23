#!/bin/bash

echo "Fetching Vercel deployments..."

# Get all deployments and extract URLs, keeping only the first 50 to avoid overwhelming output
deployments=$(vercel ls | grep -E "https://.*\.vercel\.app" | head -50)

# Convert to array and get the count
deployment_array=($deployments)
total_deployments=${#deployment_array[@]}

echo "Found $total_deployments deployments"

if [ $total_deployments -le 1 ]; then
    echo "Only one deployment found. No cleanup needed."
    exit 0
fi

# Keep the first (most recent) deployment, remove the rest
echo "Keeping the most recent deployment: ${deployment_array[0]}"
echo "Removing $((total_deployments - 1)) old deployments..."

# Remove all deployments except the first one
for ((i=1; i<total_deployments; i++)); do
    deployment_url="${deployment_array[$i]}"
    echo "Removing: $deployment_url"
    vercel remove "$deployment_url" --yes
done

echo "Cleanup complete! Kept the most recent deployment."
