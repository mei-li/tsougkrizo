//	HYPE.documents["eggs_animated01"]

(function(){(function m(){function k(a,b,c,d){var e=!1;null==window[a]&&(null==window[b]?(window[b]=[],window[b].push(m),a=document.getElementsByTagName("head")[0],b=document.createElement("script"),e=l,false==!0&&(e=""),b.type="text/javascript",""!=d&&(b.integrity=d,b.setAttribute("crossorigin","anonymous")),b.src=e+"/"+c,a.appendChild(b)):window[b].push(m),e=!0);return e}var l="eggs_animated01.hyperesources",f="eggs_animated01",g="eggsanimated01_hype_container";if(false==
!1)try{for(var c=document.getElementsByTagName("script"),a=0;a<c.length;a++){var d=c[a].src,b=null!=d?d.indexOf("/eggsanimated01_hype_generated_script.js"):-1;if(-1!=b){l=d.substr(0,b);break}}}catch(p){}c=navigator.userAgent.match(/MSIE (\d+\.\d+)/);c=parseFloat(c&&c[1])||null;d=!0==(null!=window.HYPE_664F||null!=window.HYPE_dtl_664F)||true==!0||null!=c&&10>c;a=!0==d?"HYPE-664.full.min.js":"HYPE-664.thin.min.js";c=!0==d?"F":"T";d=d?"":
"";if(false==!1&&(a=k("HYPE_664"+c,"HYPE_dtl_664"+c,a,d),false==!0&&(a=a||k("HYPE_w_664","HYPE_wdtl_664","HYPE-664.waypoints.min.js","")),false==!0&&(a=a||k("Matter","HYPE_pdtl_664","HYPE-664.physics.min.js","")),a))return;d=window.HYPE.documents;if(null!=d[f]){b=1;a=f;do f=""+a+"-"+b++;while(null!=d[f]);for(var e=document.getElementsByTagName("div"),
b=!1,a=0;a<e.length;a++)if(e[a].id==g&&null==e[a].getAttribute("HYP_dn")){var b=1,h=g;do g=""+h+"-"+b++;while(null!=document.getElementById(g));e[a].id=g;b=!0;break}if(!1==b)return}b=[];b=[{name:"initEggRoll",source:"function(hypeDocument, element, event) {\n\tvar my_egg_b = document.getElementById ('my_egg_clean_butt');\n\tvar opponent_egg_b = document.getElementById ('opponent_egg_clean_butt');\n\tvar my_egg_f = document.getElementById ('my_egg_clean_tip');\n\tvar opponent_egg_f = document.getElementById ('opponent_egg_clean_tip');\n\topponent_egg_f.style.opacity=\"1\";\t\n\topponent_egg_b.style.opacity=\"1\";\n\tmy_egg_f.style.opacity=\"1\";\t\n\tmy_egg_b.style.opacity=\"1\";\t\n}",identifier:"97"},{name:"CrackThisEggFront",source:"function(hypeDocument, element, event) {\t\tvar my_egg_b = document.getElementById ('my_egg_clean_butt');\n\t\tvar opponent_egg_b = document.getElementById ('opponent_egg_clean_butt');\n\t\tvar my_egg_f = document.getElementById ('my_egg_clean_tip');\n\t\tvar opponent_egg_f = document.getElementById ('opponent_egg_clean_tip');\n\t\tif (hypeDocument.customData[\"front\"]){\n\t\t\t//this eggs front stays intact\n\t\t\t//opponent cracks\n\t\t\topponent_egg_f.style.opacity=\"0\";\t\n\t\t}\n\t\telse{\n\t\t\t//this eggs front cracks\n\t\t\t//opponent's stays intact\n\t\t\tmy_egg_f.style.opacity=\"0\";\n\t\t}\n\t\n}",identifier:"98"},{name:"CrackThisEggBack",source:"function(hypeDocument, element, event) {\t\tvar my_egg_b = document.getElementById ('my_egg_clean_butt');\n\t\tvar opponent_egg_b = document.getElementById ('opponent_egg_clean_butt');\n\t\tvar my_egg_f = document.getElementById ('my_egg_clean_tip');\n\t\tvar opponent_egg_f = document.getElementById ('opponent_egg_clean_tip');\n\t\tif (hypeDocument.customData[\"back\"]){\n\t\t\t//this eggs butt stays intact\n\t\t\t//opponent cracks\n\t\t\topponent_egg_b.style.opacity=\"0\";\t\n\t\t}\n\t\telse{\n\t\t\t//this eggs butt cracks\n\t\t\t//opponent's stays intact\n\t\t\tmy_egg_b.style.opacity=\"0\";\n\t\t}\n\t\n\n\t\n}",identifier:"125"}];e={};h={};for(a=0;a<b.length;a++)try{h[b[a].identifier]=b[a].name,e[b[a].name]=eval("(function(){return "+b[a].source+"})();")}catch(n){window.console&&window.console.log(n),e[b[a].name]=function(){}}c=new window["HYPE_664"+c](f,g,{"7":{p:2,n:"244493__zimbot__smush_t.ogg",g:"95",t:"audio/ogg"},"3":{p:1,n:"clean_tip_2x.png",g:"18",o:true,t:"@2x"},"8":{p:2,n:"244493__zimbot__smush_t.wav",g:"95",t:"audio/vnd.wave"},"4":{p:1,n:"clean_butt.png",g:"20",o:true,t:"@1x"},"0":{p:1,n:"cracked_egg.png",g:"17",t:"@1x"},"-2":{n:"blank.gif"},"5":{p:1,n:"clean_butt_2x.png",g:"20",o:true,t:"@2x"},"1":{p:1,n:"cracked_egg-1.png",g:"5",t:"@1x"},"6":{p:2,n:"244493__zimbot__smush_t.mp3",g:"95",t:"audio/mpeg"},"2":{p:1,n:"clean_tip.png",g:"18",o:true,t:"@1x"},"-1":{n:"PIE.htc"}},l,[],e,[{n:"Untitled Scene",o:"1",X:[0]}],
[{o:"3",p:"600px",a:100,Y:375,Z:812,b:100,cA:false,c:"#FFF",L:[],bY:1,d:375,U:{},T:{"124":{q:false,z:3.16,i:"124",n:"Bump Timeline",a:[{f:"o",y:0,z:0.15,i:"b",e:-5,s:-220,o:"130"},{f:"c",p:2,y:0.1,z:0.05,i:"ActionHandler",e:{a:[{p:4,h:"98"}]},s:{a:[{p:12,o:"95",q:false}]},o:"124"},{f:"e",y:0.15,z:1,i:"b",e:-220,s:-5,o:"130"},{f:"c",p:2,y:0.15,z:3.01,i:"ActionHandler",e:{a:[{b:"60",p:3,z:false,symbolOid:"2"}]},s:{a:[{p:4,h:"98"}]},o:"124"},{f:"A",y:1,z:1.15,i:"f",e:180,s:0,o:"130"},{y:1.15,i:"b",s:-220,z:0,o:"130",f:"c"},{f:"c",y:1.21,z:1.25,i:"f",e:360,s:180,o:"126"},{y:2.15,i:"f",s:180,z:0,o:"130",f:"c"},{y:3.16,i:"f",s:360,z:0,o:"126",f:"c"},{f:"c",p:2,y:3.16,z:0,i:"ActionHandler",s:{a:[{i:0,b:"60",p:9,symbolOid:"2"},{b:"60",p:3,z:false,symbolOid:"2"}]},o:"124"}],f:30,b:[]},"60":{q:false,z:1.15,i:"60",n:"Bump Timeline Butt",a:[{f:"o",y:0,z:0.15,i:"b",e:-5,s:-220,o:"130"},{y:0,i:"f",s:180,z:0,o:"130",f:"c"},{y:0,i:"f",s:360,z:0,o:"126",f:"c"},{f:"c",p:2,y:0.1,z:0.05,i:"ActionHandler",e:{a:[{p:4,h:"125"}]},s:{a:[{p:12,o:"95",q:false}]},o:"60"},{f:"c",p:2,y:0.15,z:1,i:"ActionHandler",e:{a:[{}]},s:{a:[{p:4,h:"125"}]},o:"60"},{f:"e",y:0.15,z:1,i:"b",e:-220,s:-5,o:"130"},{y:1.15,i:"b",s:-220,z:0,o:"130",f:"c"},{f:"c",p:2,y:1.15,z:0,i:"ActionHandler",s:{a:[]},o:"60"}],f:30,b:[]},kTimelineDefaultIdentifier:{q:false,z:2,i:"kTimelineDefaultIdentifier",n:"Main Timeline",a:[{y:0,i:"a",s:0,z:0,o:"129",f:"c"},{y:0,i:"b",s:0,z:0,o:"129",f:"c"},{f:"c",p:2,y:0,z:0.01,i:"ActionHandler",e:{a:[{p:7,b:"kTimelineDefaultIdentifier",symbolOid:"2"}]},s:{a:[{p:4,h:"97"}]},o:"kTimelineDefaultIdentifier"},{f:"c",y:0,z:2,i:"b",e:-220,s:-588,o:"130"},{f:"p",y:0.01,z:0.3,i:"b",e:350,s:411,o:"126"},{f:"c",p:2,y:0.01,z:1.29,i:"ActionHandler",e:{a:[{b:"124",p:3,z:false,symbolOid:"2"}]},s:{a:[{p:7,b:"kTimelineDefaultIdentifier",symbolOid:"2"}]},o:"kTimelineDefaultIdentifier"},{y:1.01,i:"b",s:350,z:0,o:"126",f:"c"},{f:"c",p:2,y:2,z:0,i:"ActionHandler",s:{a:[{i:0,b:"124",p:9,symbolOid:"2"},{b:"124",p:3,z:false,symbolOid:"2"}]},o:"kTimelineDefaultIdentifier"},{y:2,i:"b",s:-220,z:0,o:"130",f:"c"}],f:30,b:[]}},bZ:180,O:["131","132","130","133","127","129","126","128"],n:"Untitled Layout","_":0,v:{"128":{h:"18",p:"no-repeat",x:"visible",a:0,q:"100% 100%",b:384,j:"absolute",r:"inline",z:2,bF:"126",dB:"img",d:384,i:"my_egg_clean_tip",cQ:1,k:"div",c:616,cR:1},"131":{h:"20",p:"no-repeat",x:"visible",a:0,q:"100% 100%",b:0,j:"absolute",r:"inline",z:3,bF:"130",dB:"img",d:384,i:"opponent_egg_clean_butt",cQ:1,k:"div",c:616,cR:1},"127":{h:"20",p:"no-repeat",x:"visible",a:0,q:"100% 100%",b:0,j:"absolute",r:"inline",z:3,bF:"126",dB:"img",d:384,i:"my_egg_clean_butt",cQ:1,k:"div",c:616,cR:1},"130":{x:"hidden",a:-129,bS:383,b:-588,j:"absolute",c:616,k:"div",z:5,d:768,cQ:0.49675325,f:0,cR:0.49739583},"133":{h:"18",p:"no-repeat",x:"visible",a:0,q:"100% 100%",b:384,j:"absolute",r:"inline",z:2,bF:"130",dB:"img",d:384,i:"opponent_egg_clean_tip",cQ:1,k:"div",c:616,cR:1},"126":{x:"hidden",tY:0.5,a:-118,b:411,bS:383,j:"absolute",z:1,k:"div",c:616,d:768,cQ:0.49675325,f:180,cR:0.49739583,tX:0.5},"129":{p:"no-repeat",b:0,c:616,q:"100% 100%",bS:375,d:768,r:"inline",cQ:1,bD:"none",cR:1,h:"5",i:"enemyegg2",bF:"126",j:"absolute",x:"hidden",k:"div",dB:"img",z:1,cN:"auto",tX:0.5,a:0,tY:0.5},"132":{p:"no-repeat",b:0,c:616,q:"100% 100%",bS:375,d:768,r:"inline",cQ:1,bD:"none",cR:1,h:"5",bF:"130",j:"absolute",x:"hidden",k:"div",dB:"img",z:1,cN:"auto",tX:0.5,a:0,tY:0.5}}}],{},h,{o:{p:0,q:[[0,0,0.6,0.04,0.98,0.335,1,1]]},p:{p:0,q:[[0,0,0.25,0.46,0.45,0.94,1,1]]},A:{p:0,q:[[0,0,0.785,0.135,0.15,0.86,1,1]]}},null,false,false,-1,true,true,false,true,true);d[f]=c.API;document.getElementById(g).setAttribute("HYP_dn",f);c.z_o(this.body)})();})();