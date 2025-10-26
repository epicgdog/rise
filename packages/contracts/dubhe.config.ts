import { defineConfig } from '@0xobelisk/sui-common';
 
export const dubheConfig = defineConfig({
  name: 'rise',
  description: 'mud game on the blockchain',
  enums: {},
  components: {

    player: {},
    landmark: {},
    monster: {},   // arrays
    health: 'u32', // key value
    experience: 'u32',
    level: 'u32',
    name: 'string',
    description: 'string',

    position : {
      fields: {
        x : 'u32',
        y: 'u32'
      }
    }

  },
  resources: {},
  errors: {}
});