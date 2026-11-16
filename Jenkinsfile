pipeline {
  agent any
  tools { maven 'maven'; jdk 'jdk17' }
  triggers { pollSCM('* * * * *') }
  environment {
    GEMINI_API_KEY = 'dummy-key-for-ci'
    PORT = '3000'
  }
  stages {
    stage('Test')    { steps { sh 'mvn -B clean test' } }
    stage('Build')   { steps { sh 'mvn -B package' } }
    stage('Version') { steps { sh 'mv nyaya-saarthi-release.tar.gz nyaya-saarthi-${BUILD_NUMBER}.tar.gz' } }
    stage('Archive') { steps { archiveArtifacts artifacts: '*.tar.gz', fingerprint: true } }
  }
}