import { writeFile } from 'fs'
import { ensureDirSync, removeSync } from 'fs-extra/esm'
import { fileURLToPath } from 'url'
import { join } from 'path'
import { getRadiusRange, getRandomProbability } from '@mcbe-mods/utils'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const behaviorPackPath = join(__dirname, 'src/behavior_pack')
const functionPath = join(behaviorPackPath, 'functions')
const functionParticlesPath = join(functionPath, 'particles')
const mainPath = join(functionPath, 'main.mcfunction')
const tickPath = join(functionPath, 'tick.json')

removeSync(functionPath)
ensureDirSync(functionParticlesPath)

const isOdd = (number) => number % 2 === 0

// get 10 radius location
const locations = getRadiusRange({ x: 0, y: 0, z: 0 }, 10)
  // Filter odd numbers
  .filter(({ x, z }) => isOdd(x) && isOdd(z))

const interval = [1, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]
const leaves = ['mangrove_leaves', 'leaves', 'leaves2', 'azalea_leaves', 'azalea_leaves_flowered']
const intervalLeaves = []

for (const leave of leaves) {
  const commands = locations
    .map(({ x, y, z }) => {
      const random = getRandomProbability(50) ? 0.1 : 0
      const subCommand = `if block  ~${x} ~${y + -1} ~${z} air`
      const runCommand = `run particle mfl:oak  ~${x + -0.5} ~${y + random} ~${z + -0.5}`
      return `execute as @a at @s if block ~${x} ~${y} ~${z} ${leave} ${subCommand} ${runCommand}`
    })
    .join('\n')

  const _interval = interval.map((i) => `execute as @a[scores={time=${i}}] run function particles/${leave}`).join('\n')
  intervalLeaves.push(_interval)

  const path = join(functionParticlesPath, `${leave}.mcfunction`)
  writeFile(path, commands, () => {})
}

const mainContext = `
scoreboard objectives add time dummy
scoreboard players add @a time 1

${intervalLeaves.map((i) => i).join('\n\n')}

execute as @a[scores={time=500..}] run scoreboard players set @a time 0`
writeFile(mainPath, mainContext, () => {})

const tickContext = JSON.stringify({ values: ['main'] })
writeFile(tickPath, tickContext, () => {})
