import { parseVertical } from '@lon-crm/shared';

export function getMeta() {
  return {
    vertical: parseVertical(process.env.DEFAULT_VERTICAL, 'salon'),
    version: '0.1.0',
  };
}