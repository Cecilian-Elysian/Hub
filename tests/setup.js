import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import './setup.js'

const setup = globalThis._resetMock
const setStore = globalThis._setMock
const getStore = globalThis._getMock