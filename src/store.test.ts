import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('idb-keyval',()=>({get:vi.fn(),set:vi.fn().mockResolvedValue(undefined)}));
import { get } from 'idb-keyval';
import { useGarden, validateGarden, findOpenSoil, type Garden } from './store';
const original=structuredClone(useGarden.getState().plants);
const valid=():Garden=>({version:1,plants:structuredClone(original),mood:'twilight'});
beforeEach(()=>useGarden.setState({plants:structuredClone(original),mood:'twilight',ready:true,saveError:false}));
describe('garden backups',()=>{
 it('accepts a complete valid garden',()=>expect(validateGarden(valid())).toBe(true));
 it('rejects incompatible saves and broken data',()=>{expect(validateGarden({...valid(),version:2})).toBe(false);expect(validateGarden(null)).toBe(false);expect(validateGarden({...valid(),plants:[{...original[0],growth:99}]})).toBe(false);expect(validateGarden({...valid(),plants:[{...original[0],x:NaN}]})).toBe(false);});
 it('rejects duplicate IDs and unknown plant types',()=>{expect(validateGarden({...valid(),plants:[original[0],original[0]]})).toBe(false);expect(validateGarden({...valid(),plants:[{...original[0],kind:'unknown'}]})).toBe(false);});
 it('bounds imported content and positions',()=>{expect(validateGarden({...valid(),plants:[{...original[0],title:'x'.repeat(161)}]})).toBe(false);expect(validateGarden({...valid(),plants:[{...original[0],z:100}]})).toBe(false);});
});
describe('living garden state',()=>{
 it('plants, develops, and completes without changing identity or position',()=>{const id=useGarden.getState().add('Write a page','task','A beginning',[-2,2]);useGarden.getState().update(id,{growth:1});useGarden.getState().update(id,{growth:4});const plant=useGarden.getState().plants.find(p=>p.id===id)!;expect(plant).toMatchObject({title:'Write a page',growth:4,x:-2,z:2});expect(validateGarden({version:1,plants:useGarden.getState().plants,mood:'twilight'})).toBe(true);});
 it('releases only the selected plant',()=>{useGarden.getState().remove('idea');expect(useGarden.getState().plants).toHaveLength(3);expect(useGarden.getState().plants.some(p=>p.id==='welcome')).toBe(true);});
 it('finds open soil away from water',()=>{for(let i=0;i<20;i++){const [x,z]=findOpenSoil(original);expect(((x-.6)/1.9)**2+((z-.1)/1.5)**2).toBeGreaterThanOrEqual(1);}});
 it('restores growth and mood from IndexedDB',async()=>{vi.mocked(get).mockResolvedValueOnce({...valid(),mood:'rain'});await useGarden.getState().hydrate();expect(useGarden.getState().mood).toBe('rain');expect(useGarden.getState().plants).toEqual(original);});
 it('preserves the garden and surfaces invalid saved data',async()=>{vi.mocked(get).mockResolvedValueOnce({version:800});await useGarden.getState().hydrate();expect(useGarden.getState().saveError).toBe(true);expect(useGarden.getState().plants).toEqual(original);});
});
