import typescript from 'rollup-plugin-typescript2'
import { uglify } from 'rollup-plugin-uglify';
import external from 'rollup-plugin-peer-deps-external'
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
        external(),
        typescript({
            tsconfig: 'tsconfig.json',
            tsconfigOverride: { compilerOptions: { module: 'es2015' } },
        }),
        commonjs(),
    ]
}

config.plugins.push(uglify());

export default config