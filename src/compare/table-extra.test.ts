import { bestOf } from './table'

// Extra tests written by the independent tester.
test('extra: um valor sozinho entre "—" fica sem destaque', () => {
  expect(bestOf([10, null], 'higher')).toEqual([false, false])
  expect(bestOf([null, null, null], 'lower')).toEqual([false, false, false])
})

test('extra: three-way: ties, "—" and an all-equal row among the present values', () => {
  expect(bestOf([5, null, 5], 'lower')).toEqual([false, false, false])
  expect(bestOf([5, 5, 7], 'lower')).toEqual([true, true, false])
  expect(bestOf([5, 3, null], 'lower')).toEqual([false, true, false])
  expect(bestOf([0, -1, null], 'higher')).toEqual([true, false, false])
})
