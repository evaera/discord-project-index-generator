import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import fetch from 'node-fetch'

require('dotenv').config()

const channels = require('../data/channels.json')

interface Project {
  name?: string
  channel?: string
  repo?: string
  link?: string
  desc?: string
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function getColors () {
  return fetch('https://raw.githubusercontent.com/ozh/github-colors/master/colors.json').then(res => res.json())
}

async function main () {
  const projects = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '../data/projects.yml'), 'utf8')) as Project[]

  // Alphabetize
  projects.sort((a, b) => {
    const first = a.name || a.repo || ''
    const second = b.name || b.repo || ''

    return first.toLowerCase() > second.toLowerCase() ? 1 : -1
  })

  const colors = await getColors()

  const embeds = await Promise.all(projects.map(async project => {
    let { name, channel, repo, link, desc } = project

    if (!name && !repo) {
      throw new Error('Must specify one of: name, repo')
    }

    name = name || repo

    if (channel) {
      if (!channels[channel]) {
        throw new Error(`Unknown channel ${channel}`)
      }

      channel = `<#${channels[channel]}>`
    }

    if (repo && !repo.includes('/')) {
      repo = `${process.env.GITHUB_USERNAME!}/${repo}`
    }

    let language: string | undefined
    let repoUrl: string | undefined
    let color = 0x95a5a6

    if (repo) {
      const doc = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
          ...process.env.GITHUB_TOKEN && {
            Authorization: 'Basic ' + Buffer.from(
              process.env.GITHUB_USERNAME!
              + ':' +
              process.env.GITHUB_TOKEN
            ).toString('base64')
          } as any
        }
      }).then(res => res.json())

      language = doc.language
      link = link || doc.homepage
      desc = desc || doc.description
      repoUrl = `https://github.com/${repo}`
    }

    if (language && colors[language]) {
      color = Number(colors[language].color.replace('#', '0x'))
    }

    return {
      title: name,
      description: [
        channel || '',
        desc,
        [
          link ? `[Homepage](${link})` : '',
          link && repo ? ' | ' : '',
          repo ? `[GitHub](${repoUrl})` : ''
        ].join('')
      ].join('\n\n'),
      color,
      url: link || repoUrl
    }
  }))

  for (const embed of embeds) {
    await fetch(process.env.WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        avatar_url: process.env.WEBHOOK_AVATAR!,
        username: 'Projects Index',
        embeds: [ embed ]
      })
    })

    await sleep(2000)
  }
}

main().catch(e => {
  throw e
})
