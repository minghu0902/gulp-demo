module.exports = {
    "parser": "babel-eslint",
    "env": {
        "browser": true,
        "node": true,
        "commonjs": true,
        "jquery": true,
        "es6": true
    },
    "globals": {
       
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-unused-vars": "off",    //不允许未使用的变量  
        "no-console": "off",            
        "no-case-declarations": "off",
        "no-extra-semi": "off",     // 禁止不必要的分号
    }
};