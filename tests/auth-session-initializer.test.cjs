const test=require('node:test')
const assert=require('node:assert/strict')
const path=require('node:path')
require('../scripts/register-project.cjs')
const React=require('react')
const {default:userReducer,clearAuth}=require('../src/state/slices/user-slice.ts')
let state={user:userReducer(undefined,{type:'init'})},effects=[],refs=[],cursor=0
require.cache[require.resolve('react')].exports={...React,
  useEffect:callback=>effects.push(callback),
  useRef:value=>{const i=cursor++;return refs[i]??(refs[i]={current:value})},
}
const hooksPath=path.resolve(__dirname,'../src/state/hooks.ts')
const dispatch=action=>{state={user:userReducer(state.user,action)}}
require.cache[hooksPath]={id:hooksPath,filename:hooksPath,loaded:true,exports:{useAppDispatch:()=>dispatch,useAppSelector:selector=>selector(state)}}
const {UserSessionInitializer}=require('../src/components/auth/user-session-initializer.tsx')
function render(token){effects=[];cursor=0;UserSessionInitializer({session:token?{accessToken:token,refreshToken:null}:null});effects.forEach(callback=>callback())}

test('stale server props cannot restore the token after clicking logout',()=>{
  render('initial-cookie-token')
  assert.equal(state.user.isAuthenticated,true)
  dispatch(clearAuth())
  render('initial-cookie-token')
  render('initial-cookie-token')
  assert.equal(state.user.accessToken,null)
  assert.equal(state.user.isAuthenticated,false)
  render(null)
  assert.equal(state.user.isAuthenticated,false)
  render('new-login-token')
  assert.equal(state.user.accessToken,'new-login-token')
  assert.equal(state.user.isAuthenticated,true)
  dispatch(clearAuth())
  render('new-login-token')
  assert.equal(state.user.isAuthenticated,false)
})
