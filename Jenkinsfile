pipeline {
  agent any
  tools { nodejs 'node22' }
  triggers { pollSCM('* * * * *') }
  environment {
    GEMINI_API_KEY = 'dummy-key-for-ci'
    PORT = '3000'
  }
  stages {
    stage('Install') { steps { sh 'npm ci' } }
    stage('Test')    { steps { sh 'npm test' } }
    stage('Build')   { steps { sh 'npm run build' } }
    stage('Version') { steps { sh 'mv nyaya-saarthi-release.tar.gz nyaya-saarthi-${BUILD_NUMBER}.tar.gz' } }
    stage('Archive') { steps { archiveArtifacts artifacts: '*.tar.gz', fingerprint: true } }
  }
