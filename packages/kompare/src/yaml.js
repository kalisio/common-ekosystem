import YAML from 'yaml'
import { createComparator } from './comparator.js'

export const yaml = createComparator((str) => YAML.parse(str))
