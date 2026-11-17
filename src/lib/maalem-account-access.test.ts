import assert from 'node:assert/strict'
import test from 'node:test'
import { isApprovedMaalem, maalemAccountEntry } from './maalem-account-access.ts'

test('un Maalem approuvé accède à son espace, jamais à une nouvelle candidature', () => {
  for (const type_compte of ['Client', 'Artisan', 'Promoteur', 'Artisan/Promoteur']) {
    const user = { type_compte, maalem_profile: { status: 'approved' } }
    assert.equal(isApprovedMaalem(user), true)
    assert.equal(maalemAccountEntry(user), 'workspace')
  }
})

test('les dossiers non approuvés restent des candidatures, sans accès opérationnel', () => {
  for (const status of ['draft', 'submitted', 'under_review', 'rejected', 'suspended']) {
    const user = { type_compte: 'Artisan/Promoteur', maalem_profile: { status } }
    assert.equal(isApprovedMaalem(user), false)
    assert.equal(maalemAccountEntry(user), 'application')
  }
})

test('le statut Artisan seul ne vaut pas approbation Maalem', () => {
  assert.equal(maalemAccountEntry({ type_compte: 'Artisan/Promoteur', artisan_approuve: true }), 'join')
  assert.equal(maalemAccountEntry({ type_compte: 'Client', artisan_approuve: true }), 'join')
  assert.equal(isApprovedMaalem({ artisan_approuve: true }), false)
  assert.equal(maalemAccountEntry({ type_compte: 'Client', artisan_approuve: false, demande_artisan: true }), null)
  assert.equal(maalemAccountEntry(null), null)
})
