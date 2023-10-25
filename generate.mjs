import { writeFile } from 'fs'
import { ensureDirSync, removeSync } from 'fs-extra/esm'
import { fileURLToPath } from 'url'
import { join } from 'path'
import { getRadiusRange, getRandomProbability } from '@mcbe-mods/utils'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const behaviorPackPath = join(__dirname, 'src/behavior_pack')
const functionPath = join(behaviorPackPath, 'functions')
const functionParticlesPath = join(functionPath, 'particles')
const tickPath = join(functionPath, 'tick.json')

removeSync(functionPath)
ensureDirSync(functionParticlesPath)

const isOdd = (number) => number % 2 === 0

// get 10 radius location
const locations = getRadiusRange({ x: 0, y: 0, z: 0 }, 10)
  // Filter odd numbers
  .filter(({ x, z }) => isOdd(x) && isOdd(z))

const interval = [1, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]
const leaves = ['leaves', 'leaves2', 'azalea_leaves', 'azalea_leaves_flowered', 'mangrove_leaves', 'cherry_leaves']

for (const leave of leaves) {
  const commands = locations
    .map(({ x, y, z }) => {
      const random = getRandomProbability(50) ? 0.1 : 0
      const subCommand = `if block  ~${x} ~${y + -1} ~${z} air`
      const runCommand = `run particle mfl:oak  ~${x + -0.5} ~${y + random} ~${z + -0.5}`
      return `execute at @s if block ~${x} ~${y} ~${z} ${leave} ${subCommand} ${runCommand}`
    })
    .join('\n')

  const intervals = interval
    .map((i) => `execute as @a[scores={More_Falling_Leaves=${i}}] run function particles/${leave}`)
    .join('\n')

  // -------- main run particle
  const path = join(functionParticlesPath, `${leave}.mcfunction`)
  writeFile(path, commands, () => {})

  // -------- main run call particle
  const mainPath = join(functionPath, `run_${leave}.mcfunction`)
  writeFile(mainPath, intervals, () => {})
}

// -------- main run scoreboard
const mainContext = `
scoreboard objectives add More_Falling_Leaves dummy
scoreboard players add @a More_Falling_Leaves 1
execute as @a[scores={More_Falling_Leaves=500..}] run scoreboard players set @a More_Falling_Leaves 0`
const mainPath = join(functionPath, 'run_main.mcfunction')
writeFile(mainPath, mainContext, () => {})

// -------- main run particles
const runs = leaves.map((item) => `run_${item}`)
const tickContext = JSON.stringify({ values: ['run_main', ...runs] })
writeFile(tickPath, tickContext, () => {})
