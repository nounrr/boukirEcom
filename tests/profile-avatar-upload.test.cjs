const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')
const { makeStore } = require('../src/state/store.ts')
const { setAuth, clearAuth } = require('../src/state/slices/user-slice.ts')
const { authApi } = require('../src/state/api/auth-api-slice.ts')

test('profile photo upload sends an authenticated multipart file, not a JSON preview URL', async t => {
  const saved = {id:7,avatar_url:'/uploads/avatars/7-saved.png'}
  let request
  t.mock.method(global,'fetch',async input=>{
    request=input
    return new Response(JSON.stringify({user:saved}),{headers:{'Content-Type':'application/json'}})
  })
  const store=makeStore()
  store.dispatch(setAuth({user:{id:7},accessToken:'test-avatar-token',refreshToken:null}))
  const file=new File([new Uint8Array([137,80,78,71])],'photo.png',{type:'image/png'})
  const result=await store.dispatch(authApi.endpoints.uploadProfileAvatar.initiate(file)).unwrap()
  assert.deepEqual(result,saved)
  assert.equal(request.method,'PUT')
  assert.ok(request.url.endsWith('/api/users/auth/me'))
  assert.equal(request.headers.get('Authorization'),'Bearer test-avatar-token')
  assert.match(request.headers.get('Content-Type'),/^multipart\/form-data; boundary=/)
  const data=await request.formData()
  assert.equal(data.get('avatar').name,'photo.png')
  assert.equal(data.get('avatar').type,'image/png')
  assert.equal(data.get('avatar_url'),null)
  store.dispatch(clearAuth())
})

test('photo upload failures remain errors rather than a false saved-profile result',async t=>{
  t.mock.method(global,'fetch',async()=>new Response(JSON.stringify({message:'Photo invalide'}),{status:400,headers:{'Content-Type':'application/json'}}))
  const store=makeStore()
  store.dispatch(setAuth({user:{id:7,avatar_url:'/uploads/avatars/old.png'},accessToken:'token',refreshToken:null}))
  await assert.rejects(store.dispatch(authApi.endpoints.uploadProfileAvatar.initiate(new File(['bad'],'photo.png',{type:'image/png'}))).unwrap(),error=>error.status===400)
  assert.equal(store.getState().user.user.avatar_url,'/uploads/avatars/old.png')
  store.dispatch(clearAuth())
})
