### 정리.

serverless + typescript + express + yarn + docker + serverless-offline 을 ... ESM(ECMA Script Module) 모듈 방식으로 돌리기.

1. 설치.
  - sls 명령어로 실행.
    - 이거저거 선택해서 프로젝트 만듬 ..
  - yarn 을 사용 초기화.
    - yarn init -y
    - yarn 이 global 로 설치되어 있다라는 전제 하에 ~ 
  - express, typescript 설치.
    - yarn add express
    - yarn add --dev typescript @types/node @types/express ts-node
      - ts-node 는 빌드없이 typescript 사용하기위한 플구램.
    - tsconfig.json 파일 생성.
      - https://codingapple.com/unit/typescript-tsconfig-json/
        - 'target'은 타입스크립트파일을 어떤 버전의 자바스크립트로 바꿔줄지 정하는 부분입니다.
        - es5로 셋팅해놓으면 es5 버전 자바스크립트로 컴파일(변환) 해줍니다. 
        - 신버전을 원하면 es2016, esnext 이런 것도 입력할 수 있습니다. 
        - 'module'은 자바스크립트 파일간 import 문법을 구현할 때 어떤 문법을 쓸지 정하는 곳입니다.
        - commonjs는 require 문법
        - es2015, esnext는 import 문법을 사용합니다. 
      - npx tsc --init
        ```
        {
            "compilerOptions": {
                "target": "ES6",
                "module": "CommonJS",
                "outDir": "./dist",
                "rootDir": "./src",
                "esModuleInterop": true,
                "skipLibCheck": true
            },
            "include": ["src/**/*.ts"],
            "exclude": ["node_modules"]
        }
        ```
  - serverless-offline 플러그인 설치
    - yarn add serverless-offline --dev
    - serverless.yml 에 내용 추가.
      ```yml
      # 도커가 느려서 timeout 값 충분히 늘려주지 않으면 timeout 난다 .... 
      provider:
          name: aws
          runtime: nodejs18.x
          timeout: 30

      # additional serverless offline parametar
      plugins: 
          - serverless-offline
      custom:
          serverless-offline:
              #httpsProtocol: "dev-certs"
              httpPort: 80
              stageVariables:
              foo: "bar"
      ```
    - yml에 custom 항목이 정의되어 있으면 추가할것. 
    - yarn add @vendia/serverless-express   이거 씁시다...

2. 설정변경. (ESM 방식으로 변경)
  - tsconfig.json 설정.
    ```tsconfig.json
    {
        "compilerOptions": {
            "target": "ESNext",
            "module": "ESNext",     // import 로 갈꺼임 ..
            "rootDir": "./src",                                  /* Specify the root folder within your source files. */
            "moduleResolution": "node",
            "outDir": "./dist",                                   /* Specify an output folder for all emitted files. */

            "preserveValueImports": false,                       // 변경 안하면 오류난다 ...

            "esModuleInterop": true,                             // true 로 변경.. express.js 가 commonJS 방식이라 지원하도록..

            "forceConsistentCasingInFileNames": true,            /* Ensure that casing is correct in imports. */

            /* Type Checking */
            "strict": true,                                      /* Enable all strict type-checking options. */
            "skipLibCheck": true                                 /* Skip type checking all .d.ts files. */
        },
        "include": ["src/**/*.ts"],
        "exclude": ["node_modules"],
        "ts-node": {
            "files": true
        }
    }
    ```
  - package.json 실행 설정.
    ```
    {
        "name": "sls-express-ts",
        "version": "1.0.0",
        "description": "",
        "type": "module",
        "dependencies": {
            "@vendia/serverless-express": "^4.10.4",
            "express": "^4.18.2",
            "serverless-http": "^3.1.1"
        },
        "main": "index.js",
        "license": "MIT",
        "devDependencies": {
            "@types/express": "^4.17.18",
            "@types/node": "^20.7.0",
            "serverless-offline": "^13.1.1",
            "ts-node": "^10.9.1",
            "typescript": "^5.2.2"
        },
        "scripts": {
            "start": "ts-node-esm ./src/run.ts",        // ts-node로 실행할때는, ts-node-esm 으로 실행시켜야 오류가 안난다. 
            "start-node": "tsc && node ./dist/run.js",  // tsc 이후 node 로 실행 가능 ... 
            "start-sls": "tsc && sls offline --host 0.0.0.0 --disableCookieValidation"  // sls 를 통한 실행...
        }
    }
    ```
  - serverless.yml 설정.
    ```
    service: serverless-express-mvc
    frameworkVersion: '3'

    provider:
        name: aws
        runtime: nodejs18.x
        timeout: 30
        stage: dev
        region: ap-northeast-1
        # 도쿄로 배포 ... 테스트

    functions:
        api:
            handler: dist/handler.handler
            events:
                - httpApi: '*'

    # additional serverless offline parametar
        plugins: 
            - serverless-offline
        custom:
            serverless-offline:
                #httpsProtocol: "dev-certs"
                httpPort: 80
                stageVariables:
                foo: "bar"
    ```
  - run.ts소스. app.js에서 정의된 express를 ts-node 에서 실행시키기 위한 참고사항... 
    ```run.ts
    import app from './app.js';         
    // ESM 에서는, js까지 꼭 적어줘야 한다..! ts 소스에서도 ... !  
    // 이걸 안하면 오류가 발생함.... 

    const port = process.env.PORT || 80;

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    ```
  - handler.ts 설정 sls offline 으로 실행하기 위한 설정.
    - handler.ts 도 handler.js 로 build 될 수 있게 경로 잡아주고 호출할것. 
    ```handler.ts 
    import serverlessExpress from '@vendia/serverless-express';
    import app from './app.js';         // 마찬가지... !!!!!!! 

    const handler = serverlessExpress({ app });

    export { handler };
    ```