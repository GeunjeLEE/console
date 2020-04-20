
<h1 align="center">SpaceONE Console</h1>  
  
<br/>  
<div align="center" style="display:flex;">  
  <img width="245" src="https://user-images.githubusercontent.com/35549653/76694897-de236300-66bb-11ea-9ace-b9edde9c12da.png">  
  <p> <br>
<img  alt="Version"  src="https://img.shields.io/badge/version-0.9-blue.svg?cacheSeconds=2592000"  />  
<a  href="https://spaceone-dev.gitbook.io/user-guide/"  target="_blank">  
<img  alt="Documentation"  src="https://img.shields.io/badge/documentation-yes-brightgreen.svg"  />  
</a>  
<a  href="https://www.apache.org/licenses/LICENSE-2.0"  target="_blank">  
<img  alt="License: Apache 2.0"  src="https://img.shields.io/badge/License-Apache 2.0-yellow.svg"  />  
</a> <br>
<a href="http://storybook.developer.spaceone.dev/"  target="_blank">  
    <img alt="spaceone storybook" src="https://img.shields.io/badge/DesginSystem-SpaceOne-blueviolet.svg?logo=storybook" />  
</a>  
    <img alt="spaceone storybook" src="https://github.com/spaceone-dev/console/workflows/StoryBook%20CD/badge.svg?branch=master" />  
</p>  
  
</div>    
  
&nbsp;  
  
> Front-end Project for SpaceONE project. Components made with Vue2 Composition API.  

&nbsp;  
&nbsp;  
  
## 🧩 SpaceOne Design System  
[SpaceOne storybook](http://storybook.developer.spaceone.dev/)  
  
 &nbsp;  
 &nbsp;   

  
## ⚙️ Install  
  
```sh  
 git clone github.com/spaceone-dev/console-client 

 cd spaceone-dev/console-client 

 git submodule init && git submodule update 

 npm install  
```  
&nbsp;  
&nbsp;  
  
    
  
## 🚀 Usage  
  
  ### Demo Server  
```  
 npm run serve 
```  
&nbsp;  
  
### Storybook  
```  
 npm run storybook
```  
&nbsp;  
&nbsp;  
   
## 💻 No server mode & Server mode  
SpaceONE Console project provides 'No server mode'(default) with mock data for demo.  
If you want real server, you can change the mode.  
You can log in with any ID/PW in no server mode. (ex. ID: admin, PW: admin)
  
&nbsp;  
  
```  
please copy public/config/development.json.sample file
and rename public/config/development.json

(public/config/development.json)  
  
"NO_SERVER_MODE": false  
```  
&nbsp;  
&nbsp;  

## ✨ Demo

 - Dashboard

![Dashboard](https://user-images.githubusercontent.com/35549653/76824528-bfa79e00-685a-11ea-8045-d334b3854b48.png)
&nbsp; 
 - Collector Market place 

![Collector](https://user-images.githubusercontent.com/35549653/76824520-bb7b8080-685a-11ea-91fc-400ac470391d.png)

&nbsp; 
 - Server

![Server](https://user-images.githubusercontent.com/35549653/76824531-c1716180-685a-11ea-8a0e-fc8210c68b4e.png)
  
&nbsp;  
&nbsp;
  
## 👨‍👩‍👧 Author  
  
See our [OWNERS](https://github.com/spaceone-dev/console/blob/master/AUTHORS) file.   
  
&nbsp;  
&nbsp;  
    
    
  
## 👋 Show your support  
  
Give a ⭐️ if this project helped you!   
We are preparing Contributing Guide!  
   
&nbsp;  
&nbsp;  
   
    
  
## 📝 License  
  
    
This project is [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) licensed.
