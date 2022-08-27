import typescript from 'rollup-plugin-typescript2'
import { uglify } from 'rollup-plugin-uglify';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json'

const config = {
    input: './index.ts',
    external: ['wallet-util', 'lodash'],
    output: [
        {
            globals: {
                'wallet-util': 'walletUtil',
                'lodash': '_'
              },
            file: pkg.main,
            format: 'umd',
            name: 'wallet-script'
        },
    ],
    plugins: [
        typescript({
            tsconfig: 'tsconfig.json',
            tsconfigOverride: { compilerOptions: { module: 'es2015' } },
        }),
        commonjs(),
    ]
}

config.plugins.push(uglify());

export default config