module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Evita que o Jest quebre ao tentar ler arquivos de CSS ou Imagens
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    // Se você usa caminhos com '@/' no Vite, descomente a linha abaixo:
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};