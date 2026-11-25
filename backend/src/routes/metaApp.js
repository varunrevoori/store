import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import * as metaService from '../services/metaService.js';

const metaApp = express.Router();

metaApp.get(`${API_PREFIX}/meta`, (_req, res) => {
  res.json(metaService.getMeta());
});

export default metaApp;