import { E, z } from './index-DNKSM4PU.js';

const n={pendingReviews:0,returnedReports:0,loading:false,lastFetched:null};function i(){const{subscribe:t,set:a,update:c}=z(n);return {subscribe:t,async loadCounts(){},async refreshAfterAction(){await this.loadCounts();},reset(){a(n);}}}const d=i(),o={isAuthenticated:false,currentUser:null,permissions:[],isLoading:false,error:null},e=z(o),l=E(e,t=>t.isAuthenticated),p=E(e,t=>t.currentUser),h=E(e,t=>t.permissions);E(e,t=>t.error);const f=E(e,t=>t.isLoading);

export { d, e, f, h, l, p };
//# sourceMappingURL=authStore-_wTOTagk.js.map
