class a{clients=new Map;addClient(e,t){this.clients.set(e,{controller:t}),console.log(`Report SSE client connected: ${e}, total: ${this.clients.size}`);}removeClient(e){this.clients.delete(e),console.log(`Report SSE client disconnected: ${e}, total: ${this.clients.size}`);}notifyReportStatusChange(e,t,c,i){const s=new TextEncoder,n=`data: ${JSON.stringify({type:"report_status_changed",reportId:e,worklistId:t,newStatus:c,reportStatus:i,timestamp:Date.now()})}

`;let o=0;for(const[r,l]of this.clients.entries())try{l.controller.enqueue(s.encode(n)),o++;}catch{this.removeClient(r);}return o>0&&console.log(`Notified ${o} SSE clients of report status change: report ${e} -> ${i}`),o}notifyWorklistUpdate(e,t){const c=new TextEncoder,i=`data: ${JSON.stringify({type:"worklist_updated",worklistId:e,updates:t,timestamp:Date.now()})}

`;let s=0;for(const[n,o]of this.clients.entries())try{o.controller.enqueue(c.encode(i)),s++;}catch{this.removeClient(n);}return s}notifyReportClaimed(e,t,c){const i=new TextEncoder,s=`data: ${JSON.stringify({type:"report_claimed",reportId:e,newSpecialistId:t,previousSpecialistId:c,timestamp:Date.now()})}

`;let n=0;for(const[o,r]of this.clients.entries())try{r.controller.enqueue(i.encode(s)),n++;}catch{this.removeClient(o);}return n>0&&console.log(`Notified ${n} SSE clients of report claim: report ${e} claimed by ${t}`),n}getClientCount(){return this.clients.size}}const p=new a;

export { p };
//# sourceMappingURL=reportEvents-Ce-jVB2J.js.map
