import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReportTripIssueDto } from './dto/report-trip-issue.dto';
import { DriverTripsService } from './driver-trips.service';

@Controller('driver-trips')
export class DriverTripsController {
  constructor(private readonly driverTripsService: DriverTripsService) {}

  @Get(':token')
  findTrip(@Param('token') token: string) {
    return this.driverTripsService.findTrip(token);
  }

  @Post(':token/start')
  startTrip(@Param('token') token: string) {
    return this.driverTripsService.startTrip(token);
  }

  @Post(':token/complete')
  completeTrip(@Param('token') token: string) {
    return this.driverTripsService.completeTrip(token);
  }

  @Post(':token/report-issue')
  reportIssue(
    @Param('token') token: string,
    @Body() reportTripIssueDto: ReportTripIssueDto,
  ) {
    return this.driverTripsService.reportIssue(
      token,
      reportTripIssueDto.note,
    );
  }
}
