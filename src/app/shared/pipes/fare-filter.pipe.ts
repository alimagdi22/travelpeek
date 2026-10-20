import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: false, name: 'fareFilter' })
export class FareFilterPipe implements PipeTransform {
  transform(fares: any[] | null | undefined, fareType: string) {
    return fares?.find((fare) => fare.fareType === fareType) ?? null;
  }
}
