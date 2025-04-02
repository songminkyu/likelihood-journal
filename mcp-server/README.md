# Model Context Protocol (MCP) 서버 구축 가이드

## 개요

이 문서는 Model Context Protocol (MCP) 서버를 구축하는 방법을 설명합니다. MCP는 LLM(Large Language Model)이 파일 시스템과 같은 외부 서비스에 접근할 수 있도록 하는 프로토콜입니다. 이 가이드는 `counting-chars`와 `filesystem` 서버를 설정하는 방법에 중점을 둡니다.

## 사전 요구 사항

- Node.js (최신 LTS 버전 권장)
- npm 또는 npx
- 충분한 디스크 공간
- 관리자 권한 (일부 기능에 필요할 수 있음)

## 설치 단계

### 1. 프로젝트 디렉토리 생성

먼저 MCP 서버를 위한 디렉토리 구조를 생성합니다.

```bash
mkdir -p D:\00_OpenCV_Project\Study_at_Australia\@LLM\@Agent-mcp\modelcontextprotocol-servers\src\counting-chars\dist
```

### 2. 필요한 패키지 설치

MCP 서버에 필요한 패키지를 설치합니다.

```bash
npm install @modelcontextprotocol/server-filesystem
npm install @modelcontextprotocol/sdk
```

### 3. counting-chars 서버 구현

`counting-chars` 서버는 텍스트에서 문자 수를 세는 서비스를 제공합니다. 아래 경로에 파일을 생성하세요:

`D:\00_OpenCV_Project\Study_at_Australia\@LLM\@Agent-mcp\modelcontextprotocol-servers\src\counting-chars\dist\index.js`

```javascript
const { createServer } = require('@modelcontextprotocol/sdk');

const server = createServer({
  functions: {
    countChars: {
      description: "Count the number of occurrences of a specific character or substring within a text",
      parameters: {
        text: { type: "string", description: "The source text to analyze" },
        search: { type: "string", description: "The character or substring to count occurrences of" },
        caseSensitive: { type: "boolean", description: "Whether to perform case-sensitive matching", default: true }
      },
      handler: ({ text, search, caseSensitive }) => {
        if (!caseSensitive) {
          text = text.toLowerCase();
          search = search.toLowerCase();
        }
        
        let count = 0;
        let pos = text.indexOf(search);
        
        while (pos !== -1) {
          count++;
          pos = text.indexOf(search, pos + 1);
        }
        
        return count;
      }
    }
  }
});

server.listen(0).then(({ port }) => {
  console.log(`MCP counting-chars server running on port ${port}`);
});
```

### 4. 구성 파일 생성

루트 디렉토리에 `claude_desktop_config.json` 파일을 생성하고 다음 내용을 추가합니다:

```json
{
  "mcpServers": {
    "counting-chars": {
      "command": "node",
      "args": [
        "d:\\00_OpenCV_Project\\Study_at_Australia\\@LLM\\@Agent-mcp\\modelcontextprotocol-servers\\src\\counting-chars\\dist\\index.js"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/USER/Desktop",
        "D://"
      ]
    }
  }
}
```

## 서버 실행

### counting-chars 서버 실행

```bash
node D:\00_OpenCV_Project\Study_at_Australia\@LLM\@Agent-mcp\modelcontextprotocol-servers\src\counting-chars\dist\index.js
```

### filesystem 서버 실행

```bash
npx -y @modelcontextprotocol/server-filesystem /Users/USER/Desktop D://
```

## 구성 설명

### counting-chars 서버

`counting-chars` 서버는 텍스트 내에서 특정 문자 또는 부분 문자열의 발생 횟수를 계산하는 기능을 제공합니다. 이 서버는 다음 매개변수를 사용합니다:

- `text`: 분석할 소스 텍스트
- `search`: 발생 횟수를 계산할 문자 또는 부분 문자열
- `caseSensitive`: 대소문자 구분 매칭 여부 (기본값: true)

### filesystem 서버

`filesystem` 서버는 LLM이 지정된 디렉토리 내의 파일 시스템에 접근할 수 있도록 합니다. 구성에서 두 개의 디렉토리에 대한 접근을 허용합니다:

1. `/Users/USER/Desktop`: 사용자 데스크톱 디렉토리
2. `D://`: D 드라이브 전체

## 보안 고려 사항

- 노출하고 싶지 않은 중요한 파일이나 디렉토리가 있는 경우 filesystem 서버의 경로를 제한하세요.
- 프로덕션 환경에서는 적절한 인증 및 권한 부여 메커니즘을 구현하는 것이 좋습니다.
- 서버를 공개 네트워크에 노출하기 전에 보안 감사를 수행하세요.

## 문제 해결

### 포트 충돌

서버가 시작되지 않는 경우 포트 충돌이 발생했을 수 있습니다. 이 경우 `index.js` 파일에서 다른 포트 번호를 지정하세요.

### 권한 문제

파일 시스템 접근 오류가 발생하면 적절한 권한이 있는지 확인하세요. Windows에서는 관리자 권한으로 터미널을 실행해야 할 수 있습니다.

## 추가 리소스

- [Model Context Protocol 공식 문서](https://github.com/anthropics/modelcontextprotocol)
- [MCP SDK 문서](https://github.com/anthropics/modelcontextprotocol/tree/main/sdk)
- [filesystem 서버 문서](https://github.com/anthropics/modelcontextprotocol/tree/main/servers/filesystem)

이 가이드가 Model Context Protocol 서버 구축에 도움이 되길 바랍니다. 추가 질문이 있으시면 언제든지 문의하세요.
