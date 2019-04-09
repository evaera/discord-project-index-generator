# Discord Project Index Generator

Generates a Discord web hook embed of your projects in a server! Automatically pulls descriptions and website links from your GitHub repositories.

## Instructions

Clone, change data folder files, and rename .env.example to .env and set the values.

One-liner to generate channels.json with a discord.js eval command:
`JSON.stringify(Object.assign({}, ...msg.guild.channels.array().map(r => ({[r.name]: r.id}))))`

## Example
![image](https://user-images.githubusercontent.com/2489210/55700990-89ea0c00-599f-11e9-88ff-568fa8df9be3.png)
