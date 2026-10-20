import { FareFilterPipe } from './fare-filter.pipe';

describe('FareFilterPipe', () => {
  const pipe = new FareFilterPipe();

  it('returns the matching fare type', () => {
    const fares = [
      { fareType: 'BaseFare', fareAmount: 100 },
      { fareType: 'TotalFare', fareAmount: 140 },
    ];
    expect(pipe.transform(fares, 'TotalFare')?.fareAmount).toBe(140);
  });

  it('returns null when the fare list is missing', () => {
    expect(pipe.transform(null, 'TotalFare')).toBeNull();
    expect(pipe.transform(undefined, 'TotalFare')).toBeNull();
  });
});
